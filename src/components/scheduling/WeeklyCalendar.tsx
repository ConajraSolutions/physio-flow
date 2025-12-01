import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, isWithinInterval, addMinutes, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PatientDetailsDialog } from "@/components/dashboard/PatientDetailsDialog";

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

// Mock data - will be replaced with Supabase data
const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "p1",
    patientName: "John Doe",
    patientEmail: "john@example.com",
    patientPhone: "647-555-1234",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
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
    time: "10:30",
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
    time: "14:00",
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
    time: "09:30",
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
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "11:00",
    duration: 45,
    type: "Follow-up",
    status: "scheduled",
    condition: "Chronic Neck Pain",
  },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

export function WeeklyCalendar() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForSlot = (day: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(day);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 30);

    return mockAppointments.filter((apt) => {
      const aptDate = parseISO(apt.date);
      if (!isSameDay(aptDate, day)) return false;

      const [aptHours, aptMinutes] = apt.time.split(":").map(Number);
      const aptStart = new Date(day);
      aptStart.setHours(aptHours, aptMinutes, 0, 0);

      return aptStart >= slotStart && aptStart < slotEnd;
    });
  };

  const isCurrentTimeSlot = (day: Date, time: string) => {
    if (!isSameDay(day, currentTime)) return false;
    
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(day);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 30);

    return currentTime >= slotStart && currentTime < slotEnd;
  };

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = (hours - 8) * 60 + minutes;
    const slotHeight = 60; // px per 30-min slot
    return (totalMinutes / 30) * slotHeight;
  };

  const isAppointmentNow = (apt: Appointment) => {
    const aptDate = parseISO(apt.date);
    if (!isSameDay(aptDate, currentTime)) return false;

    const [hours, minutes] = apt.time.split(":").map(Number);
    const aptStart = new Date(currentTime);
    aptStart.setHours(hours, minutes, 0, 0);
    const aptEnd = addMinutes(aptStart, apt.duration);

    return currentTime >= aptStart && currentTime < aptEnd;
  };

  const handleStartSession = (apt: Appointment) => {
    navigate(`/session-workflow/${apt.id}`, { 
      state: { 
        patientId: apt.patientId,
        patientName: apt.patientName,
        appointmentId: apt.id,
        condition: apt.condition
      } 
    });
  };

  const handlePreviousWeek = () => setWeekStart(addDays(weekStart, -7));
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7));
  const handleToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <>
      <Card variant="elevated" className="animate-slide-up">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center">
                {format(weekStart, "MMM d")} - {format(addDays(weekStart, 4), "MMM d, yyyy")}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-2">
            <div /> {/* Empty cell for time column */}
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={index}
                  className={`text-center p-2 rounded-lg ${
                    isToday ? "bg-primary/10" : "bg-secondary/50"
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-xl font-semibold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Grid with Current Time Indicator */}
          <div className="relative">
            {/* Current Time Line */}
            {isSameDay(currentTime, weekDays.find(d => isSameDay(d, currentTime)) || new Date()) && 
             currentTime.getHours() >= 8 && currentTime.getHours() < 17 && (
              <div 
                className="absolute left-[80px] right-0 h-0.5 bg-destructive z-20 pointer-events-none"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-destructive rounded-full" />
              </div>
            )}

            <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1">
              {timeSlots.map((time) => (
                <>
                  {/* Time Label */}
                  <div
                    key={`time-${time}`}
                    className="text-xs text-muted-foreground text-right pr-2 h-[60px] flex items-start pt-1"
                  >
                    {time}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day, dayIndex) => {
                    const appointments = getAppointmentsForSlot(day, time);
                    const isCurrent = isCurrentTimeSlot(day, time);

                    return (
                      <div
                        key={`${dayIndex}-${time}`}
                        className={`min-h-[60px] border-t border-border/30 relative ${
                          isCurrent ? "bg-primary/5" : ""
                        }`}
                      >
                        {appointments.map((apt) => {
                          const isNow = isAppointmentNow(apt);
                          const heightSlots = Math.ceil(apt.duration / 30);

                          return (
                            <div
                              key={apt.id}
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setDialogOpen(true);
                              }}
                              className={`absolute left-0 right-0 mx-1 p-2 rounded-md cursor-pointer transition-all hover:shadow-md z-10 ${
                                isNow
                                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                                  : apt.status === "completed"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary/20 text-foreground hover:bg-primary/30"
                              }`}
                              style={{ height: `${heightSlots * 60 - 8}px` }}
                            >
                              <div className="flex flex-col h-full">
                                <p className="font-medium text-sm truncate">
                                  {apt.patientName}
                                </p>
                                <p className={`text-xs ${isNow ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                  {apt.type}
                                </p>
                                {isNow && (
                                  <Button
                                    size="sm"
                                    variant={isNow ? "secondary" : "default"}
                                    className="mt-auto w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartSession(apt);
                                    }}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start Session
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
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
