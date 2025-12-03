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

    let systemPrompt = "";
    let userPrompt = "";

    if (editInstruction && currentSummary) {
      // EXACT Revision Prompt from master prompt - Step 4
      systemPrompt = `You are a licensed physiotherapist. You are editing an existing set of SOAP notes. The text below represents the current version of the SOAP notes that we are working with.

Rules:
• Maintain the original SOAP format (Subjective, Objective, Assessment, Plan).
• Modify only what is necessary to satisfy the revision request.
• Preserve correct physiotherapy terminology.
• Keep the notes concise, accurate, and clinically appropriate.

Output format: Return ONLY valid JSON with this exact structure:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}`;

      userPrompt = `Current SOAP Notes:
Subjective: ${currentSummary.subjective}
Objective: ${currentSummary.objective}
Assessment: ${currentSummary.assessment}
Plan: ${currentSummary.plan}

Your task is to apply the following revision request to the notes while preserving clinical accuracy and SOAP structure:

Revision Request: ${editInstruction}`;
    } else {
      // EXACT Initial SOAP Generation Prompt from master prompt - Step 2
      systemPrompt = `You are a licensed physiotherapist with expertise in orthopedic and musculoskeletal assessment. Your job is to merge two sources of clinical information: (1) a transcript of a consultation between the patient and clinician, and (2) the clinician's typed notes. Your goal is to consolidate both sources into a single, accurate, clinically appropriate set of SOAP notes.

Follow these rules:
• Remove filler conversation, greetings, unrelated dialogue, and repetitions.
• Extract clinically relevant details only.
• Merge transcript information and clinician notes into one unified narrative.
• Maintain physiotherapy-specific terminology.
• Ensure Subjective, Objective, Assessment, and Plan are clearly separated.
• Ensure treatment goals and contributing factors are captured if mentioned.

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
