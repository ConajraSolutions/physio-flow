import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SoapRequest {
  transcript: string;
  clinicianNotes: string;
  editInstruction?: string;
  currentSoap?: {
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
    const { transcript, clinicianNotes, editInstruction, currentSoap }: SoapRequest = await req.json();
    const apiKey = Deno.env.get("PHYSIO_AI_KEY");

    if (!apiKey) {
      console.error("PHYSIO_AI_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI API key is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (editInstruction && currentSoap) {
      systemPrompt = `You are a licensed physiotherapist. You are editing an existing set of SOAP notes.

Rules:
- Maintain the original SOAP format (Subjective, Objective, Assessment, Plan).
- Modify only what is necessary to satisfy the revision request.
- Preserve correct physiotherapy terminology.
- Keep the notes concise, accurate, and clinically appropriate.

Output format: Return ONLY valid JSON with this exact structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}`;

      userPrompt = `Current SOAP Notes:
Subjective: ${currentSoap.subjective}
Objective: ${currentSoap.objective}
Assessment: ${currentSoap.assessment}
Plan: ${currentSoap.plan}

Revision Request: ${editInstruction}

Apply the revision while keeping SOAP structure.`;
    } else {
      systemPrompt = `You are a licensed physiotherapist. Merge the transcript and clinician notes into a single, accurate set of SOAP notes.

Rules:
- Remove filler conversation and unrelated dialogue.
- Extract clinically relevant details only.
- Maintain physiotherapy terminology.
- Keep Subjective, Objective, Assessment, and Plan clearly separated.
- Include treatment goals and contributing factors if mentioned.

Output format: Return ONLY valid JSON with this exact structure:
{
  "subjective": "Patient's reported symptoms, history, and concerns",
  "objective": "Clinical findings, measurements, tests performed",
  "assessment": "Clinical reasoning and diagnosis",
  "plan": "Treatment plan, goals, and follow-up"
}`;

      userPrompt = `TRANSCRIPT:
${transcript || "No transcript available"}

CLINICIAN NOTES:
${clinicianNotes || "No additional notes"}

Generate SOAP notes now.`;
    }

    console.log("Calling OpenAI API for SOAP note generation");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response:", content);

    const tryParseSoap = (raw: string) => {
      // Strip code fences if present
      const cleaned = raw.replace(/```json/gi, "```").replace(/```/g, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {
            return null;
          }
        }
        return null;
      }
    };

    const parsed = tryParseSoap(content);

    if (!parsed || typeof parsed !== "object") {
      return new Response(
        JSON.stringify({
          error: "Unable to parse AI response. Please retry.",
          raw: content,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const soap = {
      subjective: parsed.subjective || "",
      objective: parsed.objective || "",
      assessment: parsed.assessment || "",
      plan: parsed.plan || "",
    };

    return new Response(JSON.stringify({ summary: soap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-soap function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
