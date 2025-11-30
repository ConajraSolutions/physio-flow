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

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
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
  const [billingOpen, setBillingOpen] = useState(false);

  if (!appointment) return null;

  const handleGoToHistory = () => {
    onOpenChange(false);
    navigate(`/patients/${appointment.patientId}/history`);
  };

  const handleBillingHistory = () => {
    onOpenChange(false);
    navigate(`/billing?patient=${appointment.patientId}`);
  };

  const handleStartSession = () => {
    onOpenChange(false);
    navigate(`/sessions/new?appointment=${appointment.id}`);
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
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Start Session
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
