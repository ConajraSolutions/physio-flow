import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  FileText,
  Dumbbell,
  User,
  Mail,
  Check,
  Loader2,
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

  const handleSendToPatient = async () => {
    setIsSending(true);

    try {
      // For now, we'll simulate saving to database
      // In production, this would save to Supabase and send email
      
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock success
      setIsSent(true);
      toast({
        title: "Treatment plan sent!",
        description: `The exercise plan has been emailed to ${patientName}`,
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
      {/* SOAP Summary */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Session Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Subjective</h4>
            <p className="text-sm text-foreground">{sessionData.summary.subjective}</p>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Objective</h4>
            <p className="text-sm text-foreground">{sessionData.summary.objective}</p>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Assessment</h4>
            <p className="text-sm text-foreground">{sessionData.summary.assessment}</p>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Plan</h4>
            <p className="text-sm text-foreground">{sessionData.summary.plan}</p>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Plan */}
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

      {/* Patient & Send */}
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
                  patient@example.com
                </p>
              </div>
            </div>

            {isSent ? (
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <span className="font-medium">Sent successfully!</span>
              </div>
            ) : (
              <Button onClick={handleSendToPatient} disabled={isSending} size="lg">
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
