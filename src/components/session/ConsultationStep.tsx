import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Clock, ArrowRight, User } from "lucide-react";

interface ConsultationStepProps {
  patientName: string;
  condition: string;
  transcript: string;
  clinicianNotes: string;
  onTranscriptChange: (transcript: string) => void;
  onNotesChange: (notes: string) => void;
  onNext: () => void;
}

export function ConsultationStep({
  patientName,
  condition,
  transcript,
  clinicianNotes,
  onTranscriptChange,
  onNotesChange,
  onNext,
}: ConsultationStepProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Simulate transcript generation
      if (!transcript) {
        onTranscriptChange(
          `Patient ${patientName} presents with ${condition || "symptoms"}. ` +
          "Patient reports experiencing discomfort for the past two weeks. " +
          "Pain level is approximately 6 out of 10. The pain increases with prolonged sitting and certain movements. " +
          "Patient has been taking over-the-counter medication with limited relief. " +
          "Previous treatments include physical therapy and rest. " +
          "Patient is motivated to follow treatment plan and return to normal activities."
        );
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const canProceed = transcript.length > 0 || clinicianNotes.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recording Panel */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Session Recording</CardTitle>
            <Badge variant={isRecording ? "destructive" : "secondary"}>
              {isRecording ? "Recording" : "Ready"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">{patientName || "Patient"}</p>
              <p className="text-sm text-muted-foreground">{condition || "Clinical Session"}</p>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col items-center py-8 space-y-6">
            <button
              onClick={handleToggleRecording}
              className={`flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
                isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isRecording ? (
                <MicOff className="h-10 w-10" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </button>
            <p className="text-muted-foreground text-center">
              {isRecording
                ? "Recording in progress... Click to stop"
                : "Click to start recording consultation"}
            </p>
            {isRecording && (
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Live Transcript Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Transcript
            </label>
            <Textarea
              placeholder={isRecording ? "Transcript will appear here as you speak..." : "Start recording to generate transcript"}
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes Panel */}
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Clinician Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Add your observations, findings, and any additional notes during the consultation.
          </p>
          
          <Textarea
            placeholder="Type your clinical observations here...

• Physical examination findings
• Range of motion assessments
• Pain triggers and patterns
• Patient goals and concerns
• Treatment considerations"
            value={clinicianNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={16}
            className="resize-none"
          />

          <div className="flex justify-end pt-4">
            <Button onClick={onNext} disabled={!canProceed}>
              Generate Summary
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
