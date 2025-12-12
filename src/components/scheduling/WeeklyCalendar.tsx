import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, addDays, isSameDay, addMinutes, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Plus, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PatientDetailsDialog } from "@/components/dashboard/PatientDetailsDialog";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { supabase } from "@/integrations/supabase/client";

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

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

const SLOT_HEIGHT = 40; // Reduced from 60 to fit more on screen
const HEADER_HEIGHT = 180; // Approximate header + navigation height

export function WeeklyCalendar() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [resizingAppointment, setResizingAppointment] = useState<string | null>(null);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(addDays(weekStart, 4), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_id,
        appointment_date,
        start_time,
        end_time,
        appointment_type,
        status,
        condition,
        patients (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("start_time");

    if (error) {
      console.error("Error fetching appointments:", error);
      return;
    }

    const mappedAppointments: Appointment[] = (data || []).map((apt: any) => {
      const startParts = apt.start_time.split(":");
      const endParts = apt.end_time.split(":");
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      const duration = endMinutes - startMinutes;

      return {
        id: apt.id,
        patientId: apt.patient_id,
        patientName: apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : "Unknown",
        patientEmail: apt.patients?.email || "",
        patientPhone: apt.patients?.phone || "",
        date: apt.appointment_date,
        time: apt.start_time.slice(0, 5),
        duration,
        type: apt.appointment_type,
        status: apt.status as any,
        condition: apt.condition,
      };
    });

    setAppointments(mappedAppointments);
  }, [weekStart]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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

    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.date);
      if (!isSameDay(aptDate, day)) return false;

      const [aptHours, aptMinutes] = apt.time.split(":").map(Number);
      const aptStart = new Date(day);
      aptStart.setHours(aptHours, aptMinutes, 0, 0);

      return aptStart >= slotStart && aptStart < slotEnd;
    });
  };

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = (hours - 8) * 60 + minutes;
    return (totalMinutes / 30) * SLOT_HEIGHT;
  };

  const isCurrentTimeVisible = () => {
    const hours = currentTime.getHours();
    return hours >= 8 && hours < 18;
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

  // Drag and drop handlers
  const handleDragStart = (apt: Appointment) => {
    setDraggedAppointment(apt);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (day: Date, time: string) => {
    if (!draggedAppointment) return;

    const newDate = format(day, "yyyy-MM-dd");
    const [hours, minutes] = time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + draggedAppointment.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_date: newDate,
        start_time: time,
        end_time: endTime,
      })
      .eq("id", draggedAppointment.id);

    if (error) {
      console.error("Error updating appointment:", error);
    } else {
      fetchAppointments();
    }

    setDraggedAppointment(null);
  };

  // Resize handlers
  const handleResizeStart = (aptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingAppointment(aptId);
  };

  const handleResizeEnd = async (apt: Appointment, newDuration: number) => {
    const [hours, minutes] = apt.time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + newDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    const { error } = await supabase
      .from("appointments")
      .update({ end_time: endTime })
      .eq("id", apt.id);

    if (error) {
      console.error("Error resizing appointment:", error);
    } else {
      fetchAppointments();
    }

    setResizingAppointment(null);
  };

  return (
    <>
      <Card variant="elevated" className="animate-slide-up flex flex-col" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setNewAppointmentOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[180px] text-center">
                {format(weekStart, "MMM d")} - {format(addDays(weekStart, 4), "MMM d, yyyy")}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col pb-2">
          {/* Day Headers */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 mb-1 flex-shrink-0">
            <div />
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={index}
                  className={`text-center p-1.5 rounded-lg ${
                    isToday ? "bg-primary/10" : "bg-secondary/50"
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Grid - Scrollable */}
          <div className="relative flex-1 overflow-y-auto">
            {/* Current Time Line */}
            {weekDays.some(d => isSameDay(d, currentTime)) && isCurrentTimeVisible() && (
              <div 
                className="absolute left-[60px] right-0 h-0.5 bg-destructive z-20 pointer-events-none"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-destructive rounded-full" />
              </div>
            )}

            <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1">
              {timeSlots.map((time) => (
                <>
                  <div
                    key={`time-${time}`}
                    className="text-xs text-muted-foreground text-right pr-2 flex items-start pt-0.5"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  >
                    {time}
                  </div>

                  {weekDays.map((day, dayIndex) => {
                    const slotAppointments = getAppointmentsForSlot(day, time);

                    return (
                      <div
                        key={`${dayIndex}-${time}`}
                        className="border-t border-border/30 relative"
                        style={{ minHeight: `${SLOT_HEIGHT}px` }}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day, time)}
                      >
                        {slotAppointments.map((apt) => {
                          const isNow = isAppointmentNow(apt);
                          const heightSlots = Math.ceil(apt.duration / 30);

                          return (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={() => handleDragStart(apt)}
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setDialogOpen(true);
                              }}
                              className={`absolute left-0 right-0 mx-0.5 p-1.5 rounded-md cursor-move transition-all hover:shadow-md z-10 ${
                                isNow
                                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                                  : apt.status === "completed"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary/20 text-foreground hover:bg-primary/30"
                              }`}
                              style={{ height: `${heightSlots * SLOT_HEIGHT - 4}px` }}
                            >
                              <div className="flex flex-col h-full">
                                <div className="flex items-center gap-0.5">
                                  <GripVertical className="h-3 w-3 opacity-50 flex-shrink-0" />
                                  <p className="font-medium text-xs truncate flex-1">
                                    {apt.patientName}
                                  </p>
                                </div>
                                <p className={`text-[10px] truncate ${isNow ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                  {apt.type}
                                </p>
                                {isNow && apt.duration >= 60 && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="mt-auto w-full h-6 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartSession(apt);
                                    }}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                  </Button>
                                )}
                                {/* Resize handle */}
                                <div
                                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 rounded-b-md"
                                  onMouseDown={(e) => handleResizeStart(apt.id, e)}
                                />
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

      <NewAppointmentModal
        open={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
        onAppointmentCreated={fetchAppointments}
      />
    </>
  );
}
