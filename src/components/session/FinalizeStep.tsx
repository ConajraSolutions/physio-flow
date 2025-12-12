import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Send,
  Dumbbell,
  User,
  Mail,
  Check,
  Loader2,
  Link,
  Sparkles,
  Copy,
  Plus,
  X,
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

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  const [emailInput, setEmailInput] = useState("");
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState(`Your Treatment Plan from ${new Date().toLocaleDateString()}`);
  const [emailMessage, setEmailMessage] = useState(
    `Dear ${patientName || "Patient"},\n\nPlease find your personalized exercise plan below. Follow the prescribed exercises as directed.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nYour Physiotherapy Team`
  );
  const [publicPlanUrl, setPublicPlanUrl] = useState<string | null>(null);

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    
    if (!isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (recipientEmails.includes(email)) {
      toast({
        title: "Duplicate email",
        description: "This email is already in the list.",
        variant: "destructive",
      });
      return;
    }
    
    setRecipientEmails([...recipientEmails, email]);
    setEmailInput("");
  };

  const removeEmail = (emailToRemove: string) => {
    setRecipientEmails(recipientEmails.filter(email => email !== emailToRemove));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const generatePublicLink = (): string => {
    if (publicPlanUrl) return publicPlanUrl;
    
    const token = crypto.randomUUID();
    const url = `${window.location.origin}/plan/${token}`;
    setPublicPlanUrl(url);
    return url;
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

  const buildEmailHtml = (planUrl: string): string => {
    const messageWithBreaks = emailMessage.replace(/\n/g, "<br>");
    
    const exercisesList = sessionData.selectedExercises
      .map((exercise) => {
        const details = [];
        if (exercise.sets) details.push(`${exercise.sets} sets`);
        if (exercise.reps) details.push(`${exercise.reps} reps`);
        if (exercise.duration_seconds) details.push(`${exercise.duration_seconds}s hold`);
        const freq = frequencyLabels[exercise.frequency] || exercise.frequency;
        
        return `<li><strong>${exercise.name}</strong> – ${details.join(" × ")} (${freq})</li>`;
      })
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Dear ${patientName || "Patient"},</p>
        
        <p>${messageWithBreaks}</p>
        
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        
        <h3 style="color: #333; margin-bottom: 16px;">Your Treatment Summary</h3>
        
        <h4 style="color: #666; margin-bottom: 8px;">Subjective</h4>
        <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${sessionData.summary.subjective}</p>
        
        <h4 style="color: #666; margin-bottom: 8px;">Objective</h4>
        <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${sessionData.summary.objective}</p>
        
        <h4 style="color: #666; margin-bottom: 8px;">Assessment</h4>
        <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${sessionData.summary.assessment}</p>
        
        <h4 style="color: #666; margin-bottom: 8px;">Plan</h4>
        <p style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">${sessionData.summary.plan}</p>
        
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        
        <h3 style="color: #333; margin-bottom: 16px;">Prescribed Exercises</h3>
        <ul style="padding-left: 20px; margin-bottom: 24px;">
          ${exercisesList}
        </ul>
        
        <p>You can view your full plan here:</p>
        <p>
          <a href="${planUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Your Exercise Plan
          </a>
        </p>
        
        <p style="margin-top: 32px; color: #666;">
          Best regards,<br />
          Your Physiotherapy Team
        </p>
      </div>
    `;
  };

  const handleSendToPatient = async () => {
    if (recipientEmails.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one email address before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Generate public link if not already generated
      const planUrl = generatePublicLink();
      
      // Build the HTML email body
      const htmlBody = buildEmailHtml(planUrl);

      // Send to all recipients
      const sendPromises = recipientEmails.map(email =>
        supabase.functions.invoke("send-plan-email", {
          body: {
            to: email,
            subject: emailSubject,
            html: htmlBody,
          },
        })
      );

      const results = await Promise.all(sendPromises);
      
      // Check for any errors
      const errors = results.filter(r => r.error || r.data?.success === false);
      
      if (errors.length > 0) {
        console.error("Some emails failed to send:", errors);
        if (errors.length === results.length) {
          throw new Error("All emails failed to send");
        }
        toast({
          title: "Partial success",
          description: `${results.length - errors.length} of ${results.length} emails sent successfully.`,
        });
      } else {
        toast({
          title: "Treatment plan sent!",
          description: `The exercise plan has been emailed to ${recipientEmails.length} recipient${recipientEmails.length > 1 ? 's' : ''}.`,
        });
      }
      
      setIsSent(true);
    } catch (error: any) {
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
            <Label htmlFor="recipientEmail">Recipients</Label>
            <div className="flex gap-2">
              <Input
                id="recipientEmail"
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
              />
              <Button type="button" variant="outline" size="icon" onClick={addEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {recipientEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipientEmails.map((email) => (
                  <Badge 
                    key={email} 
                    variant="secondary" 
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
              <Button variant="outline" onClick={() => generatePublicLink()}>
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
                  {recipientEmails.length > 0 
                    ? `${recipientEmails.length} recipient${recipientEmails.length > 1 ? 's' : ''}` 
                    : "No recipients added"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isSent && (
                <div className="flex items-center gap-2 text-primary">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Sent successfully!</span>
                </div>
              )}
              <Button 
                onClick={handleSendToPatient} 
                disabled={isSending || recipientEmails.length === 0} 
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {isSent ? "Send Again" : "Send Exercise Plan"}
                  </>
                )}
              </Button>
            </div>
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
