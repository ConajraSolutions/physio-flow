import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Mic,
  MicOff,
  FileText,
  Sparkles,
  User,
  Clock,
  ChevronRight,
} from "lucide-react";

interface Session {
  id: string;
  patientName: string;
  date: string;
  duration: string;
  type: string;
  status: "in-progress" | "completed" | "draft";
  hasSOAP: boolean;
}

const mockSessions: Session[] = [
  {
    id: "1",
    patientName: "John Doe",
    date: "2025-11-30",
    duration: "45 min",
    type: "Initial Assessment",
    status: "completed",
    hasSOAP: true,
  },
  {
    id: "2",
    patientName: "Sarah Wilson",
    date: "2025-11-29",
    duration: "30 min",
    type: "Follow-up",
    status: "completed",
    hasSOAP: true,
  },
  {
    id: "3",
    patientName: "Michael Brown",
    date: "2025-11-28",
    duration: "60 min",
    type: "Therapy Session",
    status: "completed",
    hasSOAP: true,
  },
];

export default function Sessions() {
  const [isRecording, setIsRecording] = useState(false);
  const [clinicianNotes, setClinicianNotes] = useState("");
  const [activeSession, setActiveSession] = useState<string | null>(null);

  return (
    <MainLayout>
      <PageHeader
        title="Sessions"
        description="Record consultations and generate SOAP notes with AI assistance."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Recorder */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Session Recorder</CardTitle>
                <Badge variant={isRecording ? "destructive" : "secondary"}>
                  {isRecording ? "Recording" : "Ready"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Selection */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                  JD
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">John Doe</p>
                  <p className="text-sm text-muted-foreground">
                    Lower Back Pain • Initial Assessment
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change Patient
                </Button>
              </div>

              {/* Recording Controls */}
              <div className="flex flex-col items-center py-8 space-y-6">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
                    isRecording
                      ? "bg-destructive text-destructive-foreground animate-pulse-soft"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-10 w-10" />
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                </button>
                <p className="text-muted-foreground">
                  {isRecording
                    ? "Recording in progress... Click to stop"
                    : "Click to start recording consultation"}
                </p>
                {isRecording && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-lg">00:12:34</span>
                  </div>
                )}
              </div>

              {/* Live Transcript */}
              {isRecording && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Live Transcript
                  </p>
                  <p className="text-foreground">
                    "Patient reports experiencing lower back pain for the past two
                    weeks, primarily on the left side. Pain level is around 6 out of
                    10. The pain increases with prolonged sitting..."
                  </p>
                </div>
              )}

              {/* Clinician Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Clinician Notes
                </label>
                <Textarea
                  placeholder="Add your observations and notes here..."
                  value={clinicianNotes}
                  onChange={(e) => setClinicianNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button className="flex-1" disabled={!clinicianNotes && !isRecording}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate SOAP Note
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SOAP Preview */}
          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">SOAP Note Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="subjective">
                <TabsList className="mb-4">
                  <TabsTrigger value="subjective">Subjective</TabsTrigger>
                  <TabsTrigger value="objective">Objective</TabsTrigger>
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  <TabsTrigger value="plan">Plan</TabsTrigger>
                </TabsList>

                <TabsContent value="subjective" className="space-y-3">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-muted-foreground italic">
                      Start a session to generate SOAP notes with AI assistance...
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="objective" className="space-y-3">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-muted-foreground italic">
                      Objective findings will appear here...
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="assessment" className="space-y-3">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-muted-foreground italic">
                      Clinical assessment will appear here...
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="plan" className="space-y-3">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-muted-foreground italic">
                      Treatment plan will appear here...
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <div>
          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeSession === session.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {session.patientName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.type}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                    <span>{session.duration}</span>
                    {session.hasSOAP && (
                      <Badge variant="completed" className="text-xs">
                        SOAP
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
