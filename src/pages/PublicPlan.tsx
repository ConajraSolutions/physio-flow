import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Dumbbell, User, Calendar } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string;
  body_area: string;
  goal: string;
  difficulty: string;
  instructions: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  frequency: string;
  notes?: string;
}

interface PlanData {
  patientName: string;
  summary: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  selectedExercises: Exercise[];
}

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  twice_daily: "Twice Daily",
  "3x_week": "3x per Week",
  "2x_week": "2x per Week",
  weekly: "Weekly",
};

export default function PublicPlan() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [patientName, setPatientName] = useState<string>("");

  useEffect(() => {
    const fetchPlan = async () => {
      if (!token) {
        setError("Invalid link");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("public_plans")
          .select("plan_data, patient_name, created_at")
          .eq("token", token)
          .single();

        if (fetchError) {
          console.error("Error fetching plan:", fetchError);
          setError("Plan not found. The link may be invalid or expired.");
          setLoading(false);
          return;
        }

        if (data) {
          setPlanData(data.plan_data as PlanData);
          setPatientName(data.patient_name);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An error occurred while loading the plan.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your exercise plan...</p>
        </div>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Plan Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || "The exercise plan could not be loaded."}</p>
          <p className="text-sm text-muted-foreground">
            Please contact your physiotherapist if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Exercise Plan</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  For {patientName || planData.patientName}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Treatment Summary */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Treatment Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Subjective</h4>
              <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
                {planData.summary.subjective}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Objective</h4>
              <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
                {planData.summary.objective}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Assessment</h4>
              <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
                {planData.summary.assessment}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Plan</h4>
              <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
                {planData.summary.plan}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Plan */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Prescribed Exercises</CardTitle>
              </div>
              <Badge variant="secondary">
                {planData.selectedExercises.length} exercise{planData.selectedExercises.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {planData.selectedExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="p-4 rounded-lg border border-border bg-secondary/20"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {exercise.name}
                      </h3>
                      {exercise.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {exercise.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
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
                      {exercise.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {exercise.difficulty}
                        </Badge>
                      )}
                    </div>

                    {exercise.instructions && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-primary mb-1">Instructions:</h4>
                        <p className="text-sm text-foreground whitespace-pre-line">
                          {exercise.instructions}
                        </p>
                      </div>
                    )}

                    {exercise.notes && (
                      <div className="mt-2 p-2 bg-primary/5 rounded border-l-2 border-primary">
                        <h4 className="text-xs font-medium text-primary mb-1">Notes:</h4>
                        <p className="text-sm text-foreground">{exercise.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>This is your personalized exercise plan. Follow the instructions as directed by your physiotherapist.</p>
        </div>
      </div>
    </div>
  );
}

