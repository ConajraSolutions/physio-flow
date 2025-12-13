import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { ConsultationStep } from "@/components/session/ConsultationStep";
import { SummaryStep } from "@/components/session/SummaryStep";
import { ExerciseSelectionStep } from "@/components/session/ExerciseSelectionStep";
import { ConfigureExercisesStep } from "@/components/session/ConfigureExercisesStep";
import { FinalizeStep } from "@/components/session/FinalizeStep";

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

const steps = [
  { id: 1, name: "Consultation", description: "Record session" },
  { id: 2, name: "Summary", description: "Generate SOAP note" },
  { id: 3, name: "Exercises", description: "Select exercises" },
  { id: 4, name: "Configure", description: "Set parameters" },
  { id: 5, name: "Finalize", description: "Send to patient" },
];

export default function SessionWorkflow() {
  const { appointmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { patientName, patientId, condition, sessionId } = location.state || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [sessionData, setSessionData] = useState<SessionData>({
    transcript: "",
    clinicianNotes: "",
    summary: {
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    },
    selectedExercises: [],
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExitSession = () => {
    navigate("/");
  };

  const updateSessionData = (updates: Partial<SessionData>) => {
    setSessionData((prev) => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ConsultationStep
            patientName={patientName}
            condition={condition}
            transcript={sessionData.transcript}
            clinicianNotes={sessionData.clinicianNotes}
            onTranscriptChange={(transcript) => updateSessionData({ transcript })}
            onNotesChange={(clinicianNotes) => updateSessionData({ clinicianNotes })}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <SummaryStep
            sessionId={sessionId}
            transcript={sessionData.transcript}
            clinicianNotes={sessionData.clinicianNotes}
            summary={sessionData.summary}
            onSummaryChange={(summary) => updateSessionData({ summary })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <ExerciseSelectionStep
            condition={condition}
            selectedExercises={sessionData.selectedExercises}
            onExercisesChange={(selectedExercises) => updateSessionData({ selectedExercises })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ConfigureExercisesStep
            selectedExercises={sessionData.selectedExercises}
            onExercisesChange={(selectedExercises) => updateSessionData({ selectedExercises })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <FinalizeStep
            patientName={patientName}
            patientId={patientId}
            appointmentId={appointmentId}
            sessionId={sessionId}
            sessionData={sessionData}
            onBack={handleBack}
            onComplete={handleExitSession}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleExitSession}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Session with {patientName || "Patient"}
              </h1>
              <p className="text-muted-foreground">{condition || "Clinical Session"}</p>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${
                        currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="animate-slide-up">{renderStep()}</div>
      </div>
    </MainLayout>
  );
}
