import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SessionSummaryRequest {
  payload: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    exercises?: {
      name: string;
      sets?: number | null;
      reps?: number | null;
      duration_seconds?: number | null;
      frequency?: string | null;
      notes?: string | null;
    }[];
  };
  instruction?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payload, instruction }: SessionSummaryRequest = await req.json();
    const apiKey = Deno.env.get("PHYSIO_AI_KEY");

    if (!apiKey) {
      console.error("PHYSIO_AI_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI API key is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sysPrompt =
      instruction ||
      "Generate a 2–3 sentence narrative summary of this physiotherapy session. Use a gentle, professional tone. Write in complete sentences (no bullet points), as a concise story-like overview of key findings and recommended actions. Do not return SOAP structure or JSON—only the short paragraph.";

    const exerciseSnippet =
      payload.exercises && payload.exercises.length
        ? payload.exercises
            .slice(0, 5)
            .map((ex) => {
              const parts = [ex.name];
              if (ex.sets) parts.push(`${ex.sets} sets`);
              if (ex.reps) parts.push(`${ex.reps} reps`);
              if (ex.duration_seconds) parts.push(`${ex.duration_seconds}s`);
              if (ex.frequency) parts.push(`${ex.frequency}`);
              if (ex.notes) parts.push(ex.notes);
              return parts.join(", ");
            })
            .join(" | ")
        : "No exercises recorded";

    const userPrompt = `SESSION DATA:
Subjective: ${payload.subjective || "Not provided"}
Objective: ${payload.objective || "Not provided"}
Assessment: ${payload.assessment || "Not provided"}
Plan: ${payload.plan || "Not provided"}
Exercises: ${exerciseSnippet}

Write a 2–3 sentence plain-text summary (no bullets, no headers, no JSON).`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return new Response(JSON.stringify({ error: "No summary generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up any headings or SOAP-like prefixes the model might include
    const cleaned = summary
      .replace(/^(Subjective|Objective|Assessment|Plan)\s*:/gi, "")
      .replace(/(Subjective|Objective|Assessment|Plan)\s*:/gi, "")
      .replace(/\n+/g, " ")
      .trim();

    // Limit to roughly 3 sentences
    const sentences = cleaned.split(/(?<=[.!?])\s+/).slice(0, 3);
    const concise = sentences.join(" ").trim();

    return new Response(JSON.stringify({ summary: concise || cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-session-summary function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
