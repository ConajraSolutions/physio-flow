import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, UserPlus } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentCreated: () => void;
  defaultDate?: Date;
  defaultTime?: string;
}

const physiotherapists = [
  { id: "dr-smith", name: "Dr. Smith" },
  { id: "dr-jones", name: "Dr. Jones" },
  { id: "dr-williams", name: "Dr. Williams" },
];

const appointmentTypes = [
  "Initial Assessment",
  "Follow-up",
  "Therapy Session",
  "Re-evaluation",
  "Consultation",
];

const durations = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
];

export function NewAppointmentModal({
  open,
  onOpenChange,
  onAppointmentCreated,
  defaultDate,
  defaultTime,
}: NewAppointmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientTab, setPatientTab] = useState<"existing" | "new">("existing");

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedPhysiotherapist, setSelectedPhysiotherapist] = useState<string>("dr-smith");
  const [appointmentDate, setAppointmentDate] = useState(
    defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [appointmentTime, setAppointmentTime] = useState(defaultTime || "09:00");
  const [duration, setDuration] = useState("60");
  const [appointmentType, setAppointmentType] = useState("Initial Assessment");
  const [notes, setNotes] = useState("");
  const [condition, setCondition] = useState("");

  // New patient form
  const [newPatientFirstName, setNewPatientFirstName] = useState("");
  const [newPatientLastName, setNewPatientLastName] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientDob, setNewPatientDob] = useState("");

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open]);

  useEffect(() => {
    if (defaultDate) {
      setAppointmentDate(format(defaultDate, "yyyy-MM-dd"));
    }
    if (defaultTime) {
      setAppointmentTime(defaultTime);
    }
  }, [defaultDate, defaultTime]);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name, email")
      .order("last_name");

    if (error) {
      console.error("Error fetching patients:", error);
    } else {
      setPatients(data || []);
    }
  };

  const calculateEndTime = (startTime: string, durationMins: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMins;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let patientId = selectedPatient;

      // Create new patient if needed
      if (patientTab === "new") {
        if (!newPatientFirstName || !newPatientLastName || !newPatientEmail) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required patient fields",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert({
            first_name: newPatientFirstName,
            last_name: newPatientLastName,
            email: newPatientEmail,
            date_of_birth: newPatientDob || null,
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      if (!patientId) {
        toast({
          title: "No Patient Selected",
          description: "Please select an existing patient or create a new one",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const endTime = calculateEndTime(appointmentTime, parseInt(duration));

      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientId,
          clinician_name: physiotherapists.find(p => p.id === selectedPhysiotherapist)?.name || "Dr. Smith",
          appointment_date: appointmentDate,
          start_time: appointmentTime,
          end_time: endTime,
          appointment_type: appointmentType,
          condition: condition || null,
          notes: notes || null,
          status: "scheduled",
        });

      if (appointmentError) throw appointmentError;

      toast({
        title: "Appointment Created",
        description: "The appointment has been scheduled successfully",
      });

      // Reset form
      setSelectedPatient("");
      setPatientTab("existing");
      setNewPatientFirstName("");
      setNewPatientLastName("");
      setNewPatientEmail("");
      setNewPatientDob("");
      setNotes("");
      setCondition("");

      onAppointmentCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            New Appointment
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a new appointment and optionally register a new patient.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Patient</Label>
            <Tabs value={patientTab} onValueChange={(v) => setPatientTab(v as "existing" | "new")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Existing Patient
                </TabsTrigger>
                <TabsTrigger value="new" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  New Patient
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-3 mt-3">
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="new" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={newPatientFirstName}
                      onChange={(e) => setNewPatientFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={newPatientLastName}
                      onChange={(e) => setNewPatientLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={newPatientDob}
                    onChange={(e) => setNewPatientDob(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Physiotherapist */}
          <div className="space-y-2">
            <Label>Physiotherapist</Label>
            <Select value={selectedPhysiotherapist} onValueChange={setSelectedPhysiotherapist}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {physiotherapists.map((physio) => (
                  <SelectItem key={physio.id} value={physio.id}>
                    {physio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <Select value={appointmentType} onValueChange={setAppointmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label>Condition / Reason for Visit</Label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g., Lower Back Pain"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
