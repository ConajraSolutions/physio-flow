import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Building,
  Filter,
  Search,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SessionDetailsDialog } from "@/components/dashboard/SessionDetailsDialog";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  insurance_provider?: string | null;
  insurance_id?: string | null;
  address?: string | null;
  created_at: string;
  primary_physician?: string | null;
}

interface SessionWithAppointment {
  id: string;
  status: string;
  clinician_name: string | null;
  session_date: string;
  appointment_id: string | null;
  ai_summary?: string | null;
  appointments?: {
    appointment_date: string;
    start_time: string;
    end_time: string;
    appointment_type: string | null;
    status: string;
    condition?: string | null;
  } | null;
}

interface TreatmentPlan {
  id: string;
  status: string | null;
  notes: string | null;
  sent_at: string | null;
  exercises?: {
    id: string;
    sets: number | null;
    reps: number | null;
    duration_seconds: number | null;
    frequency: string | null;
    notes: string | null;
    order_index: number | null;
    exercises: {
      name: string;
    } | null;
  }[];
}

const REQUIRED_FORMS = [
  { id: "intake", label: "Patient Intake Form", required: true },
  { id: "consent", label: "Consent to Treat", required: true },
  { id: "privacy", label: "Privacy & HIPAA", required: true },
  { id: "billing", label: "Billing Authorization", required: false },
];

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

const calculateAge = (dob?: string | null) => {
  if (!dob) return "--";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function PatientHistory() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<SessionWithAppointment[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clinicianFilter, setClinicianFilter] = useState<string>("all");
  const [injuryFilter, setInjuryFilter] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<SessionWithAppointment | null>(null);
  const [page, setPage] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [soapNote, setSoapNote] = useState<{
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    full_summary?: string | null;
  } | null>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      setLoading(true);
      setError(null);
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .maybeSingle();

      if (patientError) {
        console.error("Error fetching patient", patientError);
        setError("Unable to load patient");
        setLoading(false);
        return;
      }

      setPatient(patientData as Patient);

    const { data: sessionData, error: sessionError, count } = await supabase
      .from("sessions")
      .select(
        `
          id,
          status,
          clinician_name,
          session_date,
          appointment_id,
          appointments (
            appointment_date,
            start_time,
            end_time,
            appointment_type,
            status,
            condition
          )
        `,
        { count: "exact" }
      )
        .eq("patient_id", patientId)
        .order("session_date", { ascending: false })
        .range(page * 5, page * 5 + 4);

      if (sessionError) {
        console.error("Error fetching sessions", sessionError);
        setError("Unable to load sessions");
      } else {
        const sessionList = (sessionData || []) as SessionWithAppointment[];

        const sessionIds = sessionList.map((s) => s.id);
        let summariesMap: Record<string, string> = {};
        if (sessionIds.length) {
          const { data: notes, error: notesError } = await supabase
            .from("session_notes")
            .select("session_id, full_summary, version")
            .in("session_id", sessionIds)
            .eq("is_temporary", false)
            .order("version", { ascending: false });

          if (!notesError && notes) {
            for (const note of notes) {
              if (!summariesMap[note.session_id] && note.full_summary) {
                summariesMap[note.session_id] = note.full_summary;
              }
            }
          }
        }

        setSessions(
          sessionList.map((s) => ({
            ...s,
            ai_summary: summariesMap[s.id] || null,
          }))
        );
        setTotalSessions(count || 0);
      }

      setLoading(false);
    };

    load();
  }, [patientId, page]);

  const fullName = useMemo(
    () => (patient ? `${patient.first_name} ${patient.last_name}`.trim() : "Patient"),
    [patient]
  );

  const clinicianOptions = useMemo(() => {
    const names = sessions.map((s) => s.clinician_name).filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [sessions]);

  const injuryOptions = useMemo(() => {
    const conditions = sessions
      .map((s) => s.appointments?.condition)
      .filter((c): c is string => !!c);
    return Array.from(new Set(conditions));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const appt = session.appointments;
      const matchesSearch =
        !search ||
        `${appt?.appointment_type || "Session"} ${session.clinician_name || ""} ${appt?.condition || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesClinician =
        clinicianFilter === "all" || session.clinician_name === clinicianFilter;

      const matchesInjury = injuryFilter === "all" || appt?.condition === injuryFilter;

      return matchesSearch && matchesClinician && matchesInjury;
    });
  }, [sessions, search, clinicianFilter, injuryFilter]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedSession) {
        setSoapNote(null);
        setTreatmentPlan(null);
        return;
      }
      setDetailsLoading(true);

      const { data: soap, error: soapError } = await supabase
        .from("session_notes")
        .select("subjective, objective, assessment, plan, full_summary")
        .eq("session_id", selectedSession.id)
        .eq("is_temporary", false)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (soapError) {
        console.error("Error fetching SOAP", soapError);
      }
      setSoapNote(soap || null);

      const { data: plan, error: planError } = await supabase
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
        .eq("session_id", selectedSession.id)
        .maybeSingle();

      if (planError) {
        console.error("Error fetching treatment plan", planError);
      }
      setTreatmentPlan(plan as TreatmentPlan);

      setDetailsLoading(false);
    };

    loadDetails();
  }, [selectedSession]);

  return (
    <MainLayout>
      <PageHeader
        title="Patient Profile"
        description={`Details and history for ${fullName}`}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      {loading && (
        <Card className="mb-4">
          <CardContent className="p-6 text-muted-foreground">Loading patient…</CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-4">
          <CardContent className="p-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {patient && (
        <div className="space-y-6">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader>
              <CardTitle>Client Info</CardTitle>
              <CardDescription>Primary demographics and identifiers.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
                  {fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{fullName}</p>
                  <p className="text-sm text-muted-foreground">Age: {calculateAge(patient.date_of_birth)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email || "--"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone || "--"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <span className="text-foreground">{formatDate(patient.date_of_birth)}</span>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Insurance</p>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {patient.insurance_provider || "Not provided"}
                    {patient.insurance_id ? ` • ${patient.insurance_id}` : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{patient.address || "Not provided"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Primary Physician</p>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.primary_physician || "Not provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <CardHeader>
              <CardTitle>Required Forms</CardTitle>
              <CardDescription>Track which forms are on file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {REQUIRED_FORMS.map((form) => {
                const isSigned = false;
                return (
                  <div key={form.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="font-medium text-foreground">{form.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.required ? "Required" : "Optional"}
                      </p>
                    </div>
                    <Badge variant={isSigned ? "completed" : "destructive"}>{isSigned ? "Signed" : "Missing"}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Past sessions with SOAP/treatment context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="relative flex-1 min-w-[220px] max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search sessions by type, clinician, or condition"
                    className="pl-10"
                  />
                  {search && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setSearch("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[220px]">
                    <DropdownMenuItem disabled className="font-semibold">
                      Clinician
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setClinicianFilter("all")}>All clinicians</DropdownMenuItem>
                    {clinicianOptions.map((name) => (
                      <DropdownMenuItem key={name} onSelect={() => setClinicianFilter(name)}>
                        {name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="font-semibold">
                      Injury / Condition
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setInjuryFilter("all")}>All conditions</DropdownMenuItem>
                    {injuryOptions.map((condition) => (
                      <DropdownMenuItem key={condition} onSelect={() => setInjuryFilter(condition)}>
                        {condition}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {sessions.length === 0 && (
                <div className="text-muted-foreground text-sm">No sessions recorded yet.</div>
              )}
              {filteredSessions.map((session) => {
                const appt = session.appointments;
                const date = formatDate(appt?.appointment_date || session.session_date);
                const time = formatTimeRange(appt?.start_time, appt?.end_time);
                return (
                  <div
                    key={session.id}
                    className="rounded-lg border p-4 space-y-2 cursor-pointer hover:bg-secondary/30 transition"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <p className="font-semibold">{appt?.appointment_type || "Session"}</p>
                      </div>
                      <Badge variant={session.status === "completed" ? "completed" : "secondary"}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {session.clinician_name || "Clinician"}
                      </span>
                      <span className="flex items-center gap-1">
                        Payment:
                        <Badge variant="secondary">Not recorded</Badge>
                      </span>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">AI Summary</p>
                      <p>{session.ai_summary || "Not available."}</p>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">Click to view full session details.</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {Math.min((page * 5) + filteredSessions.length, totalSessions)} of {totalSessions} sessions (5 per page)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous 5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filteredSessions.length < 5}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next 5
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <SessionDetailsDialog
            open={!!selectedSession}
            onOpenChange={() => setSelectedSession(null)}
            sessionId={selectedSession?.id || null}
            patientEmail={patient?.email}
          />
        </div>
      )}
    </MainLayout>
  );
}
