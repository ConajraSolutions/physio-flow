import { useState, useEffect, useRef } from "react";
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
  id: number;
  type: "initial" | "manual" | "ai";
  summary: Summary;
  timestamp: Date;
}

interface SummaryStepProps {
  transcript: string;
  clinicianNotes: string;
  summary: Summary;
  onSummaryChange: (summary: Summary) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SummaryStep({
  transcript,
  clinicianNotes,
  summary,
  onSummaryChange,
  onNext,
  onBack,
}: SummaryStepProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [versions, setVersions] = useState<SummaryVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<number>(0);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSummaryRef = useRef<string>("");

  // Generate initial summary on mount if empty
  useEffect(() => {
    if (!summary.subjective && !summary.objective && !summary.assessment && !summary.plan) {
      generateSummary();
    }
  }, []);

  // Auto-save version every 10 seconds of editing
  useEffect(() => {
    const currentSummaryStr = JSON.stringify(summary);
    
    if (lastSavedSummaryRef.current !== currentSummaryStr && versions.length > 0) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        const newVersion: SummaryVersion = {
          id: versions.length + 1,
          type: "manual",
          summary: { ...summary },
          timestamp: new Date(),
        };
        setVersions(prev => [...prev, newVersion]);
        setActiveVersion(newVersion.id);
        lastSavedSummaryRef.current = currentSummaryStr;
      }, 10000); // 10 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [summary, versions.length]);

  const generateSummary = async () => {
    setIsGenerating(true);
    
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

        onSummaryChange(generatedSummary);
        lastSavedSummaryRef.current = JSON.stringify(generatedSummary);
        
        const newVersion: SummaryVersion = {
          id: versions.length + 1,
          type: "initial",
          summary: generatedSummary,
          timestamp: new Date(),
        };
        setVersions([...versions, newVersion]);
        setActiveVersion(newVersion.id);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiRevision = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: { 
          transcript, 
          clinicianNotes,
          editInstruction: aiPrompt,
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

        onSummaryChange(revisedSummary);
        lastSavedSummaryRef.current = JSON.stringify(revisedSummary);
        
        const newVersion: SummaryVersion = {
          id: versions.length + 1,
          type: "ai",
          summary: revisedSummary,
          timestamp: new Date(),
        };
        setVersions([...versions, newVersion]);
        setActiveVersion(newVersion.id);
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
      setIsGenerating(false);
    }
  };

  const handleManualEdit = (field: keyof Summary, value: string) => {
    const updatedSummary = { ...summary, [field]: value };
    onSummaryChange(updatedSummary);
  };

  const restoreVersion = (version: SummaryVersion) => {
    onSummaryChange(version.summary);
    setActiveVersion(version.id);
    lastSavedSummaryRef.current = JSON.stringify(version.summary);
  };

  const canProceed = summary.subjective && summary.objective && summary.assessment && summary.plan;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main SOAP Editor */}
      <div className="lg:col-span-3 space-y-6">
        <Card variant="elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">SOAP Note</CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Generating SOAP note with AI...</p>
              </div>
            ) : (
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
                    rows={8}
                    placeholder="Patient's description of symptoms, history, and concerns..."
                  />
                </TabsContent>

                <TabsContent value="objective">
                  <Textarea
                    value={summary.objective}
                    onChange={(e) => handleManualEdit("objective", e.target.value)}
                    rows={8}
                    placeholder="Clinical findings, measurements, and observations..."
                  />
                </TabsContent>

                <TabsContent value="assessment">
                  <Textarea
                    value={summary.assessment}
                    onChange={(e) => handleManualEdit("assessment", e.target.value)}
                    rows={8}
                    placeholder="Clinical assessment and diagnosis..."
                  />
                </TabsContent>

                <TabsContent value="plan">
                  <Textarea
                    value={summary.plan}
                    onChange={(e) => handleManualEdit("plan", e.target.value)}
                    rows={8}
                    placeholder="Treatment plan and recommendations..."
                  />
                </TabsContent>
              </Tabs>
            )}
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
                disabled={isGenerating}
              />
              <Button onClick={handleAiRevision} disabled={!aiPrompt.trim() || isGenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Revise
              </Button>
            </div>
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
            Auto-saves every 10 seconds of editing
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
                      activeVersion === version.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => restoreVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant={
                          version.type === "initial"
                            ? "default"
                            : version.type === "ai"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {version.type === "initial"
                          ? "Initial"
                          : version.type === "ai"
                          ? "AI Edit"
                          : "Manual"}
                      </Badge>
                      {activeVersion === version.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      v{version.id} • {version.timestamp.toLocaleTimeString()}
                    </p>
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
