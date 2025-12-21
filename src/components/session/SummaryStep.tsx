import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, Loader2 } from "lucide-react";
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
  edit_type: "initial_ai" | "blur_manual" | "ai_revision" | "ai_generated" | "final" | string;
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

  type UiState = "idle" | "generating" | "saving";
  const [uiState, setUiState] = useState<UiState>("idle");
  const locked = uiState === "generating" || uiState === "saving";

  const [aiPrompt, setAiPrompt] = useState("");
  const [versions, setVersions] = useState<SummaryVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>("");
  const lastSavedSummaryRef = useRef<string>("");
  const aiInFlightRef = useRef(false);
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
    if (!sessionId) {
      return;
    }

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
    }
  }, [sessionId, toast]);

  useEffect(() => {
    loadSessionNotes();
  }, [loadSessionNotes]);

  const handleGenerateSummary = async () => {
    if (!sessionId) return;
    if (aiInFlightRef.current) return;

    aiInFlightRef.current = true;
    setUiState("generating");

    const userPrompt = aiPrompt.trim();
    try {
      const { data, error } = await supabase.functions.invoke("generate-soap-notes", {
        body: {
          transcript,
          clinicianNotes,
          currentSoap: versions[0]?.summary || summary,
          editInstruction: userPrompt || undefined,
        },
      });

      if (error) throw error;

      const soap = data?.summary || data?.soap;
      if (soap) {
        const generatedSummary: Summary = {
          subjective: soap.subjective || "",
          objective: soap.objective || "",
          assessment: soap.assessment || "",
          plan: soap.plan || "",
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
            edit_type: "ai_generated",
            is_temporary: true,
            version: nextVersion,
          })
          .select("id, subjective, objective, assessment, plan, edit_type, version, created_at")
          .single();

        if (insertError) throw insertError;

        const newVersion = mapDbRowToVersion(inserted);
        newVersion.prompt = userPrompt || undefined;
        setVersions(prev => [newVersion, ...prev]);
        setActiveVersionId(newVersion.id);
        onSummaryChange(newVersion.summary);
        lastSavedSummaryRef.current = JSON.stringify(newVersion.summary);
        setAiPrompt("");

        toast({
          title: "Summary generated",
          description: "AI summary created from consultation data.",
        });
      } else {
        toast({
          title: "No notes returned",
          description: "The AI did not return SOAP notes. Please try again.",
          variant: "destructive",
        });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
      {/* Main SOAP Editor */}
      <div className="lg:col-span-3 grid gap-6 grid-rows-[auto,1fr]">
        <Card variant="elevated" className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">SOAP Note</CardTitle>
          </CardHeader>
          <CardContent>
            {locked && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {uiState === "generating" && "Waiting for AI response..."}
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

        {/* Generate Summary Panel */}
        <Card variant="elevated" className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Generate Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex gap-3">
              <Input
                placeholder="Optional: add extra guidance for AI (e.g., emphasize goals)"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateSummary()}
                disabled={locked || !sessionId}
              />
              <Button onClick={handleGenerateSummary} disabled={locked || !sessionId}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Summary
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              We combine system context, transcript, clinician notes, and any existing notes. The
              optional prompt lets you steer the output.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Version History Sidebar - Always Visible */}
      <Card variant="elevated" className="lg:col-span-1 h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Version History</CardTitle>
          <p className="text-xs text-muted-foreground">
            Saves when you click away from the editor
          </p>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-full">
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
                      <Badge variant={version.edit_type?.startsWith("ai") ? "secondary" : version.edit_type === "initial_ai" ? "default" : "outline"}>
                        {version.edit_type.replace("_", " ")}
                      </Badge>
                      {activeVersionId === version.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      v{version.version} - {new Date(version.created_at).toLocaleTimeString()}
                    </p>
                    {version.prompt && (
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
