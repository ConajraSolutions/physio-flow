import { useState } from "react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentCard } from "./AppointmentCard";
import { PatientDetailsDialog } from "./PatientDetailsDialog";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  condition?: string;
}

// Mock data - will be replaced with real data from Supabase
const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "p1",
    patientName: "John Doe",
    patientEmail: "john@example.com",
    patientPhone: "647-555-1234",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00 AM",
    duration: 60,
    type: "Initial Assessment",
    status: "scheduled",
    condition: "Lower Back Pain",
  },
  {
    id: "2",
    patientId: "p2",
    patientName: "Sarah Wilson",
    patientEmail: "sarah@example.com",
    patientPhone: "647-555-5678",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:30 AM",
    duration: 45,
    type: "Follow-up",
    status: "scheduled",
    condition: "Knee Rehabilitation",
  },
  {
    id: "3",
    patientId: "p3",
    patientName: "Michael Brown",
    patientEmail: "michael@example.com",
    patientPhone: "647-555-9012",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "02:00 PM",
    duration: 30,
    type: "Therapy Session",
    status: "pending",
    condition: "Shoulder Injury",
  },
  {
    id: "4",
    patientId: "p4",
    patientName: "Emily Davis",
    patientEmail: "emily@example.com",
    patientPhone: "647-555-3456",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "09:30 AM",
    duration: 60,
    type: "Re-evaluation",
    status: "scheduled",
    condition: "Post-Surgery Recovery",
  },
  {
    id: "5",
    patientId: "p5",
    patientName: "James Miller",
    patientEmail: "james@example.com",
    patientPhone: "647-555-7890",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "11:00 AM",
    duration: 45,
    type: "Follow-up",
    status: "scheduled",
    condition: "Chronic Neck Pain",
  },
  {
    id: "6",
    patientId: "p6",
    patientName: "Lisa Anderson",
    patientEmail: "lisa@example.com",
    patientPhone: "647-555-2468",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "03:00 PM",
    duration: 60,
    type: "Initial Assessment",
    status: "scheduled",
    condition: "Hip Pain",
  },
  {
    id: "7",
    patientId: "p7",
    patientName: "Robert Taylor",
    patientEmail: "robert@example.com",
    patientPhone: "647-555-1357",
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "10:00 AM",
    duration: 45,
    type: "Therapy Session",
    status: "scheduled",
    condition: "Tennis Elbow",
  },
  {
    id: "8",
    patientId: "p8",
    patientName: "Jennifer White",
    patientEmail: "jennifer@example.com",
    patientPhone: "647-555-8642",
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "01:30 PM",
    duration: 30,
    type: "Follow-up",
    status: "pending",
    condition: "Ankle Sprain",
  },
];

const timeSlots = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM"
];

export function CalendarView() {
  const [startDate, setStartDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const days = [startDate, addDays(startDate, 1), addDays(startDate, 2)];

  const getAppointmentsForDay = (date: Date) => {
    return mockAppointments.filter((apt) =>
      isSameDay(parseISO(apt.date), date)
    );
  };

  const handlePrevious = () => {
    setStartDate(addDays(startDate, -3));
  };

  const handleNext = () => {
    setStartDate(addDays(startDate, 3));
  };

  const handleToday = () => {
    setStartDate(new Date());
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  return (
    <>
      <Card variant="elevated" className="animate-slide-up">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2 mb-4">
            <div /> {/* Empty cell for time column */}
            {days.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={index}
                  className={`text-center p-3 rounded-lg ${
                    isToday ? "bg-primary/10" : "bg-secondary/50"
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-2xl font-semibold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(day, "MMM")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2">
            {timeSlots.map((time) => (
              <>
                {/* Time Label */}
                <div
                  key={`time-${time}`}
                  className="text-xs text-muted-foreground text-right pr-2 py-2"
                >
                  {time}
                </div>
                
                {/* Day Columns */}
                {days.map((day, dayIndex) => {
                  const dayAppointments = getAppointmentsForDay(day).filter(
                    (apt) => apt.time === time
                  );
                  
                  return (
                    <div
                      key={`${dayIndex}-${time}`}
                      className="min-h-[60px] border-t border-border/50 py-1"
                    >
                      {dayAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          patientName={apt.patientName}
                          time={apt.time}
                          duration={apt.duration}
                          type={apt.type}
                          status={apt.status}
                          onClick={() => handleAppointmentClick(apt)}
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>

      <PatientDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
      />
    </>
  );
}
