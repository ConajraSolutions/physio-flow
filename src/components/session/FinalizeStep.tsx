import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Send,
  Dumbbell,
  User,
  Mail,
  Check,
  Loader2,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  description: string;
  body_area: string;
  goal: string;
  difficulty: string;
  instructions: string;
}

interface SelectedExercise extends Exercise {
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  frequency: string;
  notes?: string;
}

interface SessionData {
  transcript: string;
  clinicianNotes: string;
  summary: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  selectedExercises: SelectedExercise[];
}

interface FinalizeStepProps {
  patientName: string;
  patientId: string;
  appointmentId?: string;
  sessionId?: string;
  sessionData: SessionData;
  onBack: () => void;
  onComplete: () => void;
}

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  twice_daily: "Twice Daily",
  "3x_week": "3x per Week",
  "2x_week": "2x per Week",
  weekly: "Weekly",
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function FinalizeStep({
  patientName,
  patientId,
  appointmentId,
  sessionId,
  sessionData,
  onBack,
  onComplete,
}: FinalizeStepProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState(
    `Your Care Plan from ${new Date().toLocaleDateString()}`
  );
  const [emailMessage, setEmailMessage] = useState(
    `Hi ${patientName || "there"},\n\nBelow is a clear overview of today's findings and what to do next. Please follow the exercise plan and reach out with any questions.\n\nWarm regards,\nYour Physiotherapy Team`
  );
  const [treatmentPlanId, setTreatmentPlanId] = useState<string | null>(null);

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    if (!isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (recipientEmails.includes(email)) {
      toast({
        title: "Duplicate email",
        description: "This email is already in the list.",
        variant: "destructive",
      });
      return;
    }

    setRecipientEmails([...recipientEmails, email]);
    setEmailInput("");
  };

  const removeEmail = (emailToRemove: string) => {
    setRecipientEmails(recipientEmails.filter((email) => email !== emailToRemove));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  // Ensure treatment plan exists for this session (one per session)
  const ensureTreatmentPlan = async (): Promise<string> => {
    if (!sessionId) {
      throw new Error("Session is required before finalizing.");
    }

    if (treatmentPlanId) return treatmentPlanId;

    const { data: existingPlan, error: planLookupError } = await supabase
      .from("treatment_plans")
      .select("id")
      .eq("session_id", sessionId)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (planLookupError) throw planLookupError;

    if (existingPlan) {
      setTreatmentPlanId(existingPlan.id);
      return existingPlan.id;
    }

    const { data: newPlan, error: planCreateError } = await supabase
      .from("treatment_plans")
      .insert({
        session_id: sessionId,
        patient_id: patientId,
        status: "draft",
      })
      .select("id")
      .single();

    if (planCreateError) throw planCreateError;

    setTreatmentPlanId(newPlan.id);
    return newPlan.id;
  };

  useEffect(() => {
    ensureTreatmentPlan().catch((error) => {
      console.error("Error ensuring treatment plan:", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Patient-friendly content (no SOAP jargon)
  const createPatientFriendlySummary = (): string => {
    const summary = sessionData.summary;
    let patientSummary = "";

    if (summary.subjective) {
      patientSummary += `<h4 style="color: #333; margin-bottom: 8px; margin-top: 16px;">Pain & Concerns</h4>`;
      patientSummary += `<p style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${summary.subjective}</p>`;
    }

    if (summary.assessment) {
      patientSummary += `<h4 style="color: #333; margin-bottom: 8px; margin-top: 16px;">What We Found</h4>`;
      patientSummary += `<p style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${summary.assessment}</p>`;
    }

    if (summary.plan) {
      patientSummary += `<h4 style="color: #333; margin-bottom: 8px; margin-top: 16px;">Therapist Recommendations</h4>`;
      patientSummary += `<p style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${summary.plan}</p>`;
    }

    return patientSummary;
  };

  const buildEmailHtml = (planUrl: string): string => {
    const messageWithBreaks = emailMessage.replace(/\n/g, "<br>");
    const patientSummary = createPatientFriendlySummary();

    const exercisesList = sessionData.selectedExercises
      .map((exercise) => {
        const details = [];
        if (exercise.sets) details.push(`${exercise.sets} sets`);
        if (exercise.reps) details.push(`${exercise.reps} reps`);
        if (exercise.duration_seconds) details.push(`${exercise.duration_seconds}s hold`);
        const freq = frequencyLabels[exercise.frequency] || exercise.frequency;

        let exerciseHtml = `<li style="margin-bottom: 12px;"><strong>${exercise.name}</strong>`;
        if (details.length > 0) {
          exerciseHtml += ` - ${details.join(", ")}`;
        }
        exerciseHtml += ` (${freq})`;
        if (exercise.notes) {
          exerciseHtml += `<br><span style="color: #666; font-size: 0.9em;">Note: ${exercise.notes}</span>`;
        }
        exerciseHtml += `</li>`;
        return exerciseHtml;
      })
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Dear ${patientName || "Patient"},</p>
        <p>${messageWithBreaks}</p>

        <h3 style="color: #333; margin: 24px 0 12px;">Pain Summary & Findings</h3>
        ${patientSummary}

        <h3 style="color: #333; margin: 24px 0 12px;">Exercise Plan</h3>
        <ul style="padding-left: 20px; margin-bottom: 24px; list-style-type: disc;">
          ${exercisesList}
        </ul>

        <p style="margin-top: 16px;">View your complete exercise plan here:</p>
        <p>
          <a href="${planUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Your Plan
          </a>
        </p>

        <p style="margin-top: 24px; color: #666;">
          Best regards,<br />
          Your Physiotherapy Team
        </p>
      </div>
    `;
  };

  const handleSendToPatient = async () => {
    if (recipientEmails.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one email address before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const planId = await ensureTreatmentPlan();
      const planUrl = `${window.location.origin}/plan/${planId}`;

      const htmlBody = buildEmailHtml(planUrl);

      if (planId) {
        await supabase
          .from("treatment_plans")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", planId);
      }

      const sendPromises = recipientEmails.map((email) =>
        supabase.functions.invoke("send-plan-email", {
          body: {
            to: email,
            subject: emailSubject,
            html: htmlBody,
          },
        })
      );

      const results = await Promise.all(sendPromises);
      const errors = results.filter((r) => r.error || r.data?.success === false);

      if (errors.length === results.length) {
        throw new Error("All emails failed to send");
      }

      if (errors.length > 0) {
        toast({
          title: "Partial success",
          description: `${results.length - errors.length} of ${results.length} emails sent.`,
        });
      } else {
        toast({
          title: "Treatment plan sent!",
          description: `Emailed to ${recipientEmails.length} recipient${recipientEmails.length > 1 ? "s" : ""}.`,
        });
      }

      setIsSent(true);
      setTreatmentPlanId(planId);
    } catch (error: any) {
      console.error("Error sending plan", error);
      toast({
        title: "Error",
        description: "Failed to send treatment plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const buildSoapNotes = (): string => {
    const parts: string[] = [];
    const { subjective, objective, assessment, plan } = sessionData.summary;
    if (subjective) parts.push(`Subjective: ${subjective}`);
    if (objective) parts.push(`Objective: ${objective}`);
    if (assessment) parts.push(`Assessment: ${assessment}`);
    if (plan) parts.push(`Plan: ${plan}`);

    if (sessionData.selectedExercises?.length) {
      const names = sessionData.selectedExercises.slice(0, 3).map((ex) => ex.name).join(", ");
      parts.push(`Exercises: ${names}${sessionData.selectedExercises.length > 3 ? "..." : "."}`);
    }

    return parts.join(" ").slice(0, 600);
  };

  const buildAiSummary = async (): Promise<string | null> => {
    try {
      const payload = {
        subjective: sessionData.summary.subjective,
        objective: sessionData.summary.objective,
        assessment: sessionData.summary.assessment,
        plan: sessionData.summary.plan,
        exercises: sessionData.selectedExercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          duration_seconds: ex.duration_seconds,
          frequency: ex.frequency,
          notes: ex.notes,
        })),
      };

      const { data, error } = await supabase.functions.invoke("ai-session-summary", {
        body: {
          payload,
          instruction:
            "Generate a 2–3 sentence narrative summary of this physiotherapy session. Use a gentle, professional, and comprehensive tone. \
            Write in complete sentences (not bullet points or note-taking style), presenting the summary as a concise, story-like overview—similar to a brief pitch"
        },
      });

      if (error) {
        console.error("AI summary error", error);
        return null;
      }

      return data?.summary || null;
    } catch (err) {
      console.error("AI summary exception", err);
      return null;
    }
  };

  const finalizeSessionNotes = async (): Promise<string | null> => {
    if (!sessionId) return;

    const { data: latest, error: latestError } = await supabase
      .from("session_notes")
      .select("id")
      .eq("session_id", sessionId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;

    if (latest?.id) {
      await supabase
        .from("session_notes")
        .update({ is_temporary: false, edit_type: "final" })
        .eq("id", latest.id);

      await supabase
        .from("session_notes")
        .delete()
        .eq("session_id", sessionId)
        .eq("is_temporary", true)
        .neq("id", latest.id);
    }

    return latest?.id || null;
  };

  const handleCompleteSession = async () => {
    setFinalizing(true);
    try {
      const latestNoteId = await finalizeSessionNotes();

      if (sessionId && latestNoteId) {
        const aiSummary = await buildAiSummary();
        if (aiSummary) {
          await supabase.from("session_notes").update({ full_summary: aiSummary }).eq("id", latestNoteId);
        }
      }

      if (sessionId) {
        await supabase.from("sessions").update({ status: "completed" }).eq("id", sessionId);
      }

      if (appointmentId) {
        await supabase.from("appointments").update({ status: "completed" }).eq("id", appointmentId);
      }

      if (treatmentPlanId && isSent) {
        await supabase
          .from("treatment_plans")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", treatmentPlanId);
      }

      toast({
        title: "Session completed",
        description: "Session and appointment archived as completed.",
      });

      onComplete();
    } catch (error: any) {
      console.error("Finalize session failed", error);
      toast({
        title: "Unable to complete session",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Summary Section (SOAP is clinician-only) */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Summary (SOAP)</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Clinical summary for records. Not sent to the patient.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-primary">Subjective</h4>
            <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
              {sessionData.summary.subjective}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-primary">Objective</h4>
            <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
              {sessionData.summary.objective}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-primary">Assessment</h4>
            <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
              {sessionData.summary.assessment}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-primary">Plan</h4>
            <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
              {sessionData.summary.plan}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Plan */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Exercise Plan</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {sessionData.selectedExercises.length} exercises prescribed
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionData.selectedExercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="p-3 rounded-lg border border-border bg-secondary/20"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{exercise.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {exercise.sets && (
                      <Badge variant="secondary" className="text-xs">
                        {exercise.sets} sets
                      </Badge>
                    )}
                    {exercise.reps && (
                      <Badge variant="secondary" className="text-xs">
                        {exercise.reps} reps
                      </Badge>
                    )}
                    {exercise.duration_seconds && (
                      <Badge variant="secondary" className="text-xs">
                        {exercise.duration_seconds}s hold
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {frequencyLabels[exercise.frequency] || exercise.frequency}
                    </Badge>
                  </div>
                  {exercise.notes && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: {exercise.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Composition */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Email to Patient</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            SOAP stays internal. Email includes patient-friendly summary and exercises.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipients</Label>
            <div className="flex gap-2">
              <Input
                id="recipientEmail"
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
              />
              <Button type="button" variant="outline" size="icon" onClick={addEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {recipientEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipientEmails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailSubject">Subject</Label>
            <Input
              id="emailSubject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailMessage">Message</Label>
            <Textarea
              id="emailMessage"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Send / Complete Session */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Send / Complete Session</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-foreground">{patientName || "Patient"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {recipientEmails.length > 0
                    ? `${recipientEmails.length} recipient${recipientEmails.length > 1 ? "s" : ""}`
                    : "No recipients added"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isSent && (
                <div className="flex items-center gap-2 text-primary">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Sent</span>
                </div>
              )}
              <Button
                onClick={handleSendToPatient}
                disabled={isSending || recipientEmails.length === 0}
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {isSent ? "Send Again" : "Send Plan"}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack} disabled={isSending || finalizing}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleCompleteSession} disabled={finalizing || !sessionId}>
              {finalizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Session
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
