import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Summary {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface SummaryVersion {
  id: string;
  version: number;
  edit_type: "initial_ai" | "blur_manual" | "ai_revision" | "final" | string;
  summary: Summary;
  created_at: string;
  prompt?: string;
}

interface SummaryStepProps {
  sessionId?: string;
  transcript: string;
  clinicianNotes: string;
  summary: Summary;
  onSummaryChange: (summary: Summary) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SummaryStep({
  sessionId,
  transcript,
  clinicianNotes,
  summary,
  onSummaryChange,
  onNext,
  onBack,
}: SummaryStepProps) {
  const { toast } = useToast();

  type UiState = "initializing" | "idle" | "generating" | "revising" | "saving";
  const [uiState, setUiState] = useState<UiState>("initializing");
  const locked = uiState !== "idle";

  const [aiPrompt, setAiPrompt] = useState("");
  const [versions, setVersions] = useState<SummaryVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>("");
  const lastSavedSummaryRef = useRef<string>("");
  const aiInFlightRef = useRef(false);
  const didAutoGenerateRef = useRef(false);
  const onSummaryChangeRef = useRef(onSummaryChange);

  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange;
  }, [onSummaryChange]);

  const mapDbRowToVersion = (row: any): SummaryVersion => ({
    id: row.id,
    version: row.version,
    edit_type: row.edit_type,
    summary: {
      subjective: row.subjective || "",
      objective: row.objective || "",
      assessment: row.assessment || "",
      plan: row.plan || "",
    },
    created_at: row.created_at,
  });

  const loadSessionNotes = useCallback(async () => {
    if (!sessionId) return;

    setUiState("initializing");
    try {
      const { data, error } = await supabase
        .from("session_notes")
        .select("id, subjective, objective, assessment, plan, edit_type, version, created_at")
        .eq("session_id", sessionId)
        .order("version", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map(mapDbRowToVersion);
        setVersions(mapped);
        onSummaryChangeRef.current(mapped[0].summary);
        setActiveVersionId(mapped[0].id);
        lastSavedSummaryRef.current = JSON.stringify(mapped[0].summary);
      } else {
        // No notes yet; start with editable blank fields
        setVersions([]);
        setActiveVersionId("");
        lastSavedSummaryRef.current = JSON.stringify({
          subjective: "",
          objective: "",
          assessment: "",
          plan: "",
        });
      }
    } catch (error) {
      console.error("Error loading session notes:", error);
      toast({
        title: "Error",
        description: "Unable to load session notes.",
        variant: "destructive",
      });
    } finally {
      setUiState("idle");
    }
  }, [sessionId, toast]);

  useEffect(() => {
    loadSessionNotes();
  }, [loadSessionNotes]);

  const createInitialAiNote = async () => {
    if (!sessionId) return;
    if (aiInFlightRef.current) return;
    aiInFlightRef.current = true;

    setUiState("generating");
    try {
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: { transcript, clinicianNotes },
      });

      if (error) throw error;

      if (data?.summary) {
        const generatedSummary: Summary = {
          subjective: data.summary.subjective || "",
          objective: data.summary.objective || "",
          assessment: data.summary.assessment || "",
          plan: data.summary.plan || "",
        };

        const nextVersion = (versions[0]?.version || 0) + 1;

        const { data: inserted, error: insertError } = await supabase
          .from("session_notes")
          .insert({
            session_id: sessionId,
            subjective: generatedSummary.subjective,
            objective: generatedSummary.objective,
            assessment: generatedSummary.assessment,
            plan: generatedSummary.plan,
            edit_type: "initial_ai",
            is_temporary: true,
            version: nextVersion,
          })
          .select("id, subjective, objective, assessment, plan, edit_type, version, created_at")
          .single();

        if (insertError) throw insertError;

        const newVersion = mapDbRowToVersion(inserted);
        setVersions(prev => [newVersion, ...prev]);
        setActiveVersionId(newVersion.id);
        onSummaryChange(newVersion.summary);
        lastSavedSummaryRef.current = JSON.stringify(newVersion.summary);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUiState("idle");
      aiInFlightRef.current = false;
    }
  };

  const handleAiRevision = async () => {
    if (!aiPrompt.trim()) return;
    if (!sessionId) return;
    if (aiInFlightRef.current) return;

    const revisionPromptUsed = aiPrompt.trim();
    aiInFlightRef.current = true;
    setUiState("revising");

    try {
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: {
          transcript,
          clinicianNotes,
          editInstruction: revisionPromptUsed,
          currentSummary: summary,
        },
      });

      if (error) throw error;

      if (data?.summary) {
        const revisedSummary: Summary = {
          subjective: data.summary.subjective || summary.subjective,
          objective: data.summary.objective || summary.objective,
          assessment: data.summary.assessment || summary.assessment,
          plan: data.summary.plan || summary.plan,
        };

        const nextVersion = (versions[0]?.version || 0) + 1;

        const { data: inserted, error: insertError } = await supabase
          .from("session_notes")
          .insert({
            session_id: sessionId,
            subjective: revisedSummary.subjective,
            objective: revisedSummary.objective,
            assessment: revisedSummary.assessment,
            plan: revisedSummary.plan,
            edit_type: "ai_revision",
            is_temporary: true,
            version: nextVersion,
          })
          .select("id, subjective, objective, assessment, plan, edit_type, version, created_at")
          .single();

        if (insertError) throw insertError;

        const newVersion = mapDbRowToVersion(inserted);
        newVersion.prompt = revisionPromptUsed;
        setVersions(prev => [newVersion, ...prev]);
        setActiveVersionId(newVersion.id);
        onSummaryChange(newVersion.summary);
        lastSavedSummaryRef.current = JSON.stringify(newVersion.summary);
        setAiPrompt("");

        toast({
          title: "Summary Updated",
          description: "AI has revised the summary based on your instruction.",
        });
      }
    } catch (error) {
      console.error("Error revising summary:", error);
      toast({
        title: "Error",
        description: "Failed to revise summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUiState("idle");
      aiInFlightRef.current = false;
    }
  };

  const handleManualEdit = (field: keyof Summary, value: string) => {
    const updatedSummary = { ...summary, [field]: value };
    onSummaryChange(updatedSummary);
  };

  // Save-on-blur: create a new manual version when the user leaves the textarea
  const handleBlur = async () => {
    if (!sessionId) return;
    if (uiState !== "idle") return;
    const currentSummaryStr = JSON.stringify(summary);

    if (lastSavedSummaryRef.current !== currentSummaryStr) {
      setUiState("saving");
      const nextVersion = (versions[0]?.version || 0) + 1;

      try {
        const { data: inserted, error } = await supabase
          .from("session_notes")
          .insert({
            session_id: sessionId,
            subjective: summary.subjective,
            objective: summary.objective,
            assessment: summary.assessment,
            plan: summary.plan,
            edit_type: "blur_manual",
            is_temporary: true,
            version: nextVersion,
          })
          .select("id, subjective, objective, assessment, plan, edit_type, version, created_at")
          .single();

        if (error) throw error;

        const newVersion = mapDbRowToVersion(inserted);
        setVersions(prev => [newVersion, ...prev]);
        setActiveVersionId(newVersion.id);
        lastSavedSummaryRef.current = currentSummaryStr;
      } catch (error) {
        console.error("Error saving session note", error);
        toast({
          title: "Save failed",
          description: "Could not save your changes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUiState("idle");
      }
    }
  };

  const restoreVersion = (version: SummaryVersion) => {
    onSummaryChange(version.summary);
    setActiveVersionId(version.id);
    lastSavedSummaryRef.current = JSON.stringify(version.summary);
  };

  const canProceed = summary.subjective && summary.objective && summary.assessment && summary.plan;

  // Auto-generate once when entering and no notes exist
  useEffect(() => {
    if (!sessionId) return;
    if (uiState !== "idle") return;
    if (versions.length > 0) return;
    if (didAutoGenerateRef.current) return;

    didAutoGenerateRef.current = true;
    createInitialAiNote();
  }, [sessionId, uiState, versions.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {locked && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 shadow">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {uiState === "initializing" && "Loading notes..."}
              {uiState === "generating" && "Generating initial AI notes..."}
              {uiState === "revising" && "Revising notes with AI..."}
              {uiState === "saving" && "Saving..."}
            </span>
          </div>
        </div>
      )}
      {/* Main SOAP Editor */}
      <div className="lg:col-span-3 space-y-6">
        <Card variant="elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">SOAP Note</CardTitle>
          </CardHeader>
          <CardContent>
            {uiState !== "idle" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {uiState === "initializing" && "Loading notes..."}
                  {uiState === "generating" && "Waiting for AI response..."}
                  {uiState === "revising" && "Waiting for AI response..."}
                  {uiState === "saving" && "Saving..."}
                </span>
              </div>
            )}
            <Tabs defaultValue="subjective" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="subjective">Subjective</TabsTrigger>
                <TabsTrigger value="objective">Objective</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
                <TabsTrigger value="plan">Plan</TabsTrigger>
              </TabsList>

              <TabsContent value="subjective">
                <Textarea
                  value={summary.subjective}
                  onChange={(e) => handleManualEdit("subjective", e.target.value)}
                  onBlur={handleBlur}
                  rows={8}
                  placeholder="Patient's description of symptoms, history, and concerns..."
                  disabled={locked}
                />
              </TabsContent>

              <TabsContent value="objective">
                <Textarea
                  value={summary.objective}
                  onChange={(e) => handleManualEdit("objective", e.target.value)}
                  onBlur={handleBlur}
                  rows={8}
                  placeholder="Clinical findings, measurements, and observations..."
                  disabled={locked}
                />
              </TabsContent>

              <TabsContent value="assessment">
                <Textarea
                  value={summary.assessment}
                  onChange={(e) => handleManualEdit("assessment", e.target.value)}
                  onBlur={handleBlur}
                  rows={8}
                  placeholder="Clinical assessment and diagnosis..."
                  disabled={locked}
                />
              </TabsContent>

              <TabsContent value="plan">
                <Textarea
                  value={summary.plan}
                  onChange={(e) => handleManualEdit("plan", e.target.value)}
                  onBlur={handleBlur}
                  rows={8}
                  placeholder="Treatment plan and recommendations..."
                  disabled={locked}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Revision Panel */}
        <Card variant="elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">AI Revision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Ask AI to revise... (e.g., 'make it more concise', 'add treatment goals')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiRevision()}
                disabled={locked}
              />
              <Button onClick={handleAiRevision} disabled={!aiPrompt.trim() || locked}>
                <Sparkles className="h-4 w-4 mr-2" />
                Revise
              </Button>
            </div>
            {versions.length === 0 && (
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={createInitialAiNote}
                  disabled={locked || !sessionId}
                >
                  {uiState === "generating" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating initial summary...
                    </>
                  ) : (
                    "Generate initial AI summary"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Optional: generate a first draft. You can also type manually.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!canProceed}>
            Select Exercises
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Version History Sidebar - Always Visible */}
      <Card variant="elevated" className="lg:col-span-1">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Version History</CardTitle>
          <p className="text-xs text-muted-foreground">
            Saves when you click away from the editor
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No versions yet. Generate a summary to start.
              </p>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      activeVersionId === version.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => restoreVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={version.edit_type === "ai_revision" ? "secondary" : version.edit_type === "initial_ai" ? "default" : "outline"}>
                        {version.edit_type.replace("_", " ")}
                      </Badge>
                      {activeVersionId === version.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      v{version.version} - {new Date(version.created_at).toLocaleTimeString()}
                    </p>
                    {version.edit_type === "ai_revision" && version.prompt && (
                      <p className="text-xs text-muted-foreground mt-1 italic truncate">
                        "{version.prompt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
