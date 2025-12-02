import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestRequest {
  summary: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  condition: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { summary, condition }: SuggestRequest = await req.json();
    const PHYSIO_KEY = Deno.env.get("physio-key");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!PHYSIO_KEY) {
      throw new Error("AI API key is not configured");
    }

    // Fetch available exercises from database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: exercises, error: exerciseError } = await supabase
      .from("exercises")
      .select("id, name, body_area, goal, difficulty, description");

    if (exerciseError) {
      console.error("Error fetching exercises:", exerciseError);
      throw new Error("Failed to fetch exercises");
    }

    const exerciseList = exercises?.map(e => 
      `- ${e.name} (Body: ${e.body_area}, Goal: ${e.goal}, Difficulty: ${e.difficulty}): ${e.description || ''}`
    ).join("\n") || "No exercises available";

    const systemPrompt = `You are a physiotherapy exercise recommendation assistant. Based on the patient's clinical summary and available exercises, suggest the most appropriate exercises.

Available exercises in the clinic's library:
${exerciseList}

Guidelines:
- Only suggest exercises from the available list above
- Consider the patient's condition, pain levels, and functional goals
- Start with easier exercises and progress to harder ones
- Include a mix of stretching, strengthening, and mobility exercises as appropriate
- Provide brief rationale for each suggestion

Return ONLY valid JSON with this structure:
{
  "suggestions": [
    {
      "exerciseId": "uuid of the exercise",
      "exerciseName": "name of the exercise",
      "rationale": "brief reason for this suggestion",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

    const userPrompt = `Patient Condition: ${condition || "Not specified"}

SOAP Summary:
- Subjective: ${summary.subjective}
- Objective: ${summary.objective}
- Assessment: ${summary.assessment}
- Plan: ${summary.plan}

Based on this clinical picture, suggest appropriate exercises from the available library.`;

    console.log("Calling AI gateway for exercise suggestions");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PHYSIO_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let suggestions;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || [];
      } else {
        suggestions = [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      suggestions = [];
    }

    // Enrich suggestions with full exercise data
    const enrichedSuggestions = suggestions.map((s: any) => {
      const exercise = exercises?.find(e => 
        e.id === s.exerciseId || e.name.toLowerCase() === s.exerciseName?.toLowerCase()
      );
      return {
        ...s,
        exercise: exercise || null,
      };
    }).filter((s: any) => s.exercise !== null);

    return new Response(JSON.stringify({ suggestions: enrichedSuggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-exercises function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
