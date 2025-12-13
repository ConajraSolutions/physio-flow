import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  FileText, 
  History, 
  CreditCard,
  Stethoscope
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BillingDialog } from "./BillingDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled" | "pending" | "in_progress";
  condition?: string;
}

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function PatientDetailsDialog({
  open,
  onOpenChange,
  appointment,
}: PatientDetailsDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingOpen, setBillingOpen] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  if (!appointment) return null;

  const handleGoToHistory = () => {
    onOpenChange(false);
    navigate(`/patients/${appointment.patientId}/history`);
  };

  const handleBillingHistory = () => {
    onOpenChange(false);
    navigate(`/billing?patient=${appointment.patientId}`);
  };

  // `state` is an object that is sent over to the session workflow page, without
  // having to embed it in the URL
  const handleStartSession = async () => {
    if (!appointment) return;

    setStartingSession(true);

    try {
      // Mark the appointment as in-progress for scheduling queue
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "in_progress" })
        .eq("id", appointment.id);

      if (updateError) {
        throw updateError;
      }

      // Find an existing session for this appointment/patient
      const { data: existingSession, error: sessionLookupError } = await supabase
        .from("sessions")
        .select("id")
        .eq("appointment_id", appointment.id)
        .maybeSingle();

      if (sessionLookupError) {
        throw sessionLookupError;
      }

      let sessionId = existingSession?.id;

      // Create session if it doesn't exist yet
      if (!sessionId) {
        const { data: newSession, error: sessionCreateError } = await supabase
          .from("sessions")
          .insert({
            patient_id: appointment.patientId,
            appointment_id: appointment.id,
            status: "in_progress",
            clinician_name: "Clinician",
          })
          .select("id")
          .single();

        if (sessionCreateError) {
          throw sessionCreateError;
        }

        sessionId = newSession.id;
      } else {
        // Make sure the session status reflects in-progress state
        await supabase
          .from("sessions")
          .update({ status: "in_progress" })
          .eq("id", sessionId);
      }

      onOpenChange(false); // close the dialog

      navigate(`/session-workflow/${appointment.id}`, {
        state: {
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          appointmentId: appointment.id,
          sessionId,
          condition: appointment.condition,
        },
      });
    } catch (error: any) {
      console.error("Failed to start session", error);
      toast({
        title: "Unable to start session",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    } finally {
      setStartingSession(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
                {appointment.patientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-xl">{appointment.patientName}</p>
                <Badge variant={appointment.status} className="mt-1">
                  {appointment.status}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Appointment Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{appointment.date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{appointment.time}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{appointment.type}</span>
              </div>
              {appointment.condition && (
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{appointment.condition}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{appointment.patientEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{appointment.patientPhone}</span>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleStartSession}
                disabled={startingSession}
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                {startingSession ? "Starting..." : "Start Session"}
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleGoToHistory}
              >
                <History className="h-4 w-4 mr-2" />
                View Session History
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleBillingHistory}
              >
                <FileText className="h-4 w-4 mr-2" />
                Billing History
              </Button>
              
              <Button 
                className="w-full justify-start"
                onClick={() => setBillingOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Bill Insurance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BillingDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        patientName={appointment.patientName}
        appointmentId={appointment.id}
      />
    </>
  );
}
