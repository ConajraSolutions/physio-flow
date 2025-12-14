import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, FileText, Mail, Shield, User } from "lucide-react";

interface TreatmentPlanExercise {
  id: string;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  frequency: string | null;
  notes: string | null;
  order_index: number | null;
  exercises: { name: string } | null;
}

interface SessionDetails {
  id: string;
  status: string;
  clinician_name: string | null;
  session_date: string;
  appointments?: {
    appointment_date: string | null;
    start_time: string | null;
    end_time: string | null;
    appointment_type: string | null;
    condition?: string | null;
  } | null;
}

interface SessionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  patientEmail?: string | null;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start) return "--";
  if (!end) return start.slice(0, 5);
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
};

export function SessionDetailsDialog({
  open,
  onOpenChange,
  sessionId,
  patientEmail,
}: SessionDetailsDialogProps) {
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [soapNote, setSoapNote] = useState<{
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
  } | null>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<{
    id: string;
    status: string | null;
    notes: string | null;
    sent_at: string | null;
    exercises?: TreatmentPlanExercise[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !sessionId) return;

    const load = async () => {
      setLoading(true);

      const { data: sessionData } = await supabase
        .from("sessions")
        .select(
          `
            id,
            status,
            clinician_name,
            session_date,
            appointments (
              appointment_date,
              start_time,
              end_time,
              appointment_type,
              condition
            )
          `
        )
        .eq("id", sessionId)
        .maybeSingle();

      setDetails(sessionData as SessionDetails);

      const { data: soap } = await supabase
        .from("session_notes")
        .select("subjective, objective, assessment, plan, full_summary")
        .eq("session_id", sessionId)
        .eq("is_temporary", false)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSoapNote(soap || null);

      const { data: plan } = await supabase
        .from("treatment_plans")
        .select(
          `
            id,
            status,
            notes,
            sent_at,
            treatment_plan_exercises (
              id,
              sets,
              reps,
              duration_seconds,
              frequency,
              notes,
              order_index,
              exercises ( name )
            )
          `
        )
        .eq("session_id", sessionId)
        .maybeSingle();

      setTreatmentPlan(plan as any);
      setLoading(false);
    };

    load();
  }, [open, sessionId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {details?.appointments?.appointment_type || "Session Details"}
          </DialogTitle>
          <DialogDescription>
            Full session details including SOAP, plan, and delivery info.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2 overflow-y-auto pr-1" style={{ maxHeight: "70vh" }}>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(details?.appointments?.appointment_date || details?.session_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeRange(details?.appointments?.start_time, details?.appointments?.end_time)}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {details?.clinician_name || "Clinician"}
            </span>
            {details?.status && (
              <Badge variant={details.status === "completed" ? "completed" : "secondary"}>
                {details.status}
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">SOAP Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2 max-h-64 overflow-y-auto">
                {loading ? (
                  "Loading..."
                ) : soapNote ? (
                  <>
                    <div>
                      <p className="font-semibold text-foreground">Subjective</p>
                      <p>{soapNote.subjective || "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Objective</p>
                      <p>{soapNote.objective || "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Assessment</p>
                      <p>{soapNote.assessment || "—"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Plan</p>
                      <p>{soapNote.plan || "—"}</p>
                    </div>
                  </>
                ) : (
                  "Not available."
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Treatment Plan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2 max-h-64 overflow-y-auto">
                {loading ? (
                  "Loading..."
                ) : treatmentPlan ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{treatmentPlan.status || "Unknown"}</Badge>
                      {treatmentPlan.sent_at && <span>Sent {formatDate(treatmentPlan.sent_at)}</span>}
                    </div>
                    <p>{treatmentPlan.notes || "No notes provided."}</p>
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">Exercises</p>
                      {treatmentPlan.exercises && treatmentPlan.exercises.length > 0 ? (
                        <ul className="space-y-1 list-disc pl-4 text-muted-foreground">
                          {treatmentPlan.exercises
                            .slice()
                            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                            .map((exercise) => (
                              <li key={exercise.id}>
                                <span className="font-medium text-foreground">
                                  {exercise.exercises?.name || "Exercise"}
                                </span>
                                <span> — </span>
                                <span>
                                  {exercise.sets ? `${exercise.sets} sets` : ""}{" "}
                                  {exercise.reps ? `${exercise.reps} reps` : ""}{" "}
                                  {exercise.duration_seconds ? `${exercise.duration_seconds}s` : ""}
                                  {exercise.frequency ? ` · ${exercise.frequency}` : ""}
                                </span>
                                {exercise.notes && <span> · {exercise.notes}</span>}
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p>No exercises added.</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground pt-1">
                      Sent to: {patientEmail || "No patient email on file"}
                    </div>
                  </>
                ) : (
                  "Not available."
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AI Summary</CardTitle>
              <DialogDescription>Auto-generated overview.</DialogDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
              {soapNote?.full_summary || "Not available."}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Delivery & Billing</CardTitle>
              <DialogDescription>Email destinations and payment status.</DialogDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>No delivery records yet.</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Payment: Not recorded</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
