import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Clock, ArrowRight, User, AlertCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = transcript;

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
            onTranscriptChange(finalTranscript);
          } else {
            interimTranscript += result[0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "aborted") {
          toast({
            title: "Recording Error",
            description: `Speech recognition error: ${event.error}`,
            variant: "destructive",
          });
        }
        stopRecording();
      };

      recognition.onend = () => {
        if (isRecording) {
          // Restart if still recording (browser may stop automatically)
          try {
            recognition.start();
          } catch (e) {
            console.log("Recognition ended");
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone. Transcript is read-only during recording.",
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Recognition already stopped");
      }
      recognitionRef.current = null;
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
      toast({
        title: "Recording Stopped",
        description: "Your transcript has been saved. You can now edit it manually.",
      });
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

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

          {/* Speech Recognition Warning */}
          {!speechSupported && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Speech recognition not supported. Use Chrome or Edge for voice transcription.</p>
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex flex-col items-center py-8 space-y-6">
            <button
              onClick={handleToggleRecording}
              disabled={!speechSupported}
              className={`flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
                isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : speechSupported
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
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
                : speechSupported
                ? "Click to start recording consultation"
                : "Voice recording unavailable"}
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Transcript
              </label>
              {isRecording && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Read-only during recording</span>
                </div>
              )}
            </div>
            <Textarea
              placeholder={isRecording ? "Transcript will appear here as you speak..." : "Start recording to generate transcript, or type manually"}
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              rows={6}
              className="resize-none"
              readOnly={isRecording}
              disabled={isRecording}
            />
            {!isRecording && transcript && (
              <p className="text-xs text-muted-foreground">
                You can now edit the transcript manually to correct any errors.
              </p>
            )}
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
