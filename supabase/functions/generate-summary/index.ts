import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummaryRequest {
  transcript: string;
  clinicianNotes: string;
  editInstruction?: string;
  currentSummary?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, clinicianNotes, editInstruction, currentSummary }: SummaryRequest = await req.json();
    const apiKey = Deno.env.get("PHYSIO_AI_KEY");

    if (!apiKey) {
      console.error("PHYSIO_AI_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI API key is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = `You are an expert physiotherapy clinical documentation assistant. Your task is to generate professional SOAP notes (Subjective, Objective, Assessment, Plan) from consultation transcripts and clinician notes.

Guidelines:
- Be concise but thorough
- Use professional medical terminology appropriate for physiotherapy
- Focus on functional outcomes and patient-centered goals
- Include relevant measurements, range of motion assessments, and functional tests
- Document pain levels, functional limitations, and treatment responses

Output format: Return ONLY valid JSON with this exact structure:
{
  "subjective": "Patient's reported symptoms, history, and concerns",
  "objective": "Clinical findings, measurements, tests performed",
  "assessment": "Clinical reasoning and diagnosis",
  "plan": "Treatment plan, goals, and follow-up"
}`;

    let userPrompt = "";

    if (editInstruction && currentSummary) {
      // Edit existing summary based on instruction
      userPrompt = `Current SOAP Summary:
Subjective: ${currentSummary.subjective}
Objective: ${currentSummary.objective}
Assessment: ${currentSummary.assessment}
Plan: ${currentSummary.plan}

Edit Instruction: ${editInstruction}

Please revise the SOAP summary according to the edit instruction while maintaining clinical accuracy.`;
    } else {
      // Generate new summary
      userPrompt = `Generate a SOAP note from the following consultation:

TRANSCRIPT:
${transcript || "No transcript available"}

CLINICIAN NOTES:
${clinicianNotes || "No additional notes"}

Generate a comprehensive SOAP note based on this information.`;
    }

    console.log("Calling OpenAI API for summary generation");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
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

    console.log("Raw AI response:", content);

    // Parse the JSON from the response
    let summary;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Return a structured fallback
      summary = {
        subjective: "Unable to parse AI response. Please try again.",
        objective: "",
        assessment: "",
        plan: "",
      };
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-summary function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
