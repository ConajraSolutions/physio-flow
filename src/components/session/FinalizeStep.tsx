import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Send,
  FileText,
  Dumbbell,
  User,
  Mail,
  Check,
  Loader2,
  Link,
  Sparkles,
  Copy,
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

export function FinalizeStep({
  patientName,
  patientId,
  appointmentId,
  sessionData,
  onBack,
  onComplete,
}: FinalizeStepProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [patientEmail, setPatientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState(`Your Treatment Plan from ${new Date().toLocaleDateString()}`);
  const [emailMessage, setEmailMessage] = useState(
    `Dear ${patientName || "Patient"},\n\nPlease find your personalized exercise plan attached below. Follow the prescribed exercises as directed.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nYour Physiotherapy Team`
  );
  const [publicPlanUrl, setPublicPlanUrl] = useState<string | null>(null);

  const generatePublicLink = () => {
    // Generate a secure tokenized URL (in production, this would create a record in the database)
    const token = crypto.randomUUID();
    const url = `${window.location.origin}/plan/${token}`;
    setPublicPlanUrl(url);
    toast({
      title: "Public link generated",
      description: "The patient can view their plan at this URL without logging in.",
    });
  };

  const copyLink = () => {
    if (publicPlanUrl) {
      navigator.clipboard.writeText(publicPlanUrl);
      toast({
        title: "Link copied",
        description: "The public plan link has been copied to your clipboard.",
      });
    }
  };

  const handleSendToPatient = async () => {
    if (!patientEmail) {
      toast({
        title: "Email required",
        description: "Please enter the patient's email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Generate public link if not already generated
      if (!publicPlanUrl) {
        generatePublicLink();
      }

      // In production, this would call an edge function that uses AWS SES
      // For now, we simulate the email sending
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsSent(true);
      toast({
        title: "Treatment plan sent!",
        description: `The exercise plan has been emailed to ${patientEmail}`,
      });
    } catch (error) {
      console.error("Error sending treatment plan:", error);
      toast({
        title: "Error",
        description: "Failed to send treatment plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI Summary Section */}
      <Card variant="elevated" className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Summary</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Final SOAP notes and treatment overview
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-primary mb-1">Subjective</h4>
                <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">{sessionData.summary.subjective}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-primary mb-1">Objective</h4>
                <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">{sessionData.summary.objective}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-primary mb-1">Assessment</h4>
                <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">{sessionData.summary.assessment}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-primary mb-1">Plan</h4>
                <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">{sessionData.summary.plan}</p>
              </div>
            </div>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientEmail">Patient Email</Label>
            <Input
              id="patientEmail"
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
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

      {/* Public Link & Send */}
      <Card variant="elevated" className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Public Exercise Plan Link</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate a secure link that patients can access without logging in
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {publicPlanUrl ? (
              <div className="flex-1 flex items-center gap-2">
                <Input value={publicPlanUrl} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={generatePublicLink}>
                <Link className="h-4 w-4 mr-2" />
                Generate Public Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Section */}
      <Card variant="elevated" className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Send to Patient</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-foreground">{patientName || "Patient"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {patientEmail || "No email entered"}
                </p>
              </div>
            </div>

            {isSent ? (
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <span className="font-medium">Sent successfully!</span>
              </div>
            ) : (
              <Button onClick={handleSendToPatient} disabled={isSending || !patientEmail} size="lg">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Exercise Plan
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="lg:col-span-2 flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSending}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onComplete} disabled={!isSent}>
          Complete Session
          <Check className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
