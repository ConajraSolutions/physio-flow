import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, addMinutes, parseISO, isWithinInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play, Plus, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PatientDetailsDialog } from "@/components/dashboard/PatientDetailsDialog";
import { NewAppointmentModal } from "./NewAppointmentModal";
import { supabase } from "@/integrations/supabase/client";
import { useTimeZoneSettings } from "@/hooks/useTimeZoneSettings";
import { getTimeInTimeZone, getDateInTimeZone } from "@/lib/timeZone";
import { useBusinessHours } from "@/hooks/useBusinessHours";
import { useToast } from "@/hooks/use-toast";

type CalendarStatus = "scheduled" | "completed" | "cancelled" | "pending" | "in_progress";

interface CalendarItem {
  id: string;
  appointmentId?: string;
  sessionId?: string;
  kind: "appointment" | "session";
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  endTime?: string;
  duration: number;
  type: string;
  status: CalendarStatus;
  condition?: string;
}

const SLOT_HEIGHT = 40; // Reduced from 60 to fit more on screen
const HEADER_HEIGHT = 180; // Approximate header + navigation height

const parseTimeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const minutesToTimeString = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const generateTimeSlots = (start: string, end: string) => {
  const slots: string[] = [];
  let current = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  while (current < endMinutes) {
    slots.push(minutesToTimeString(current));
    current += 30;
  }

  return slots;
};

export function WeeklyCalendar() {
  const navigate = useNavigate();
  const { effectiveTimeZone } = useTimeZoneSettings();
  const { isWithinBusinessHours, getBusinessHoursRange } = useBusinessHours();
  const { toast } = useToast();
  const businessHoursRange = useMemo(() => getBusinessHoursRange(), [getBusinessHoursRange]);
  const [gridRef, setGridRef] = useState<HTMLDivElement | null>(null);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(getDateInTimeZone(effectiveTimeZone), { weekStartsOn: 1 })
  );
  const [, setCurrentTime] = useState(() => getDateInTimeZone(effectiveTimeZone));
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [draggedAppointment, setDraggedAppointment] = useState<CalendarItem | null>(null);
  const [, setResizingAppointment] = useState<string | null>(null);
  const timeSlots = useMemo(() => generateTimeSlots("00:00", "24:00"), []);

  // Fetch appointments and completed sessions
  const fetchCalendarItems = useCallback(async () => {
    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(addDays(weekStart, 4), "yyyy-MM-dd");

    const { data: appointmentsData, error: appointmentsError } = await supabase
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
      .in("status", ["scheduled", "pending", "in_progress"])
      .order("start_time");

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
    }

    const mappedAppointments: CalendarItem[] = (appointmentsData || []).map((apt: any) => {
      const duration = parseTimeToMinutes(apt.end_time) - parseTimeToMinutes(apt.start_time);

      return {
        id: apt.id,
        appointmentId: apt.id,
        kind: "appointment",
        patientId: apt.patient_id,
        patientName: apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : "Unknown",
        patientEmail: apt.patients?.email || "",
        patientPhone: apt.patients?.phone || "",
        date: apt.appointment_date,
        time: apt.start_time?.slice(0, 5) || businessHoursRange.start,
        endTime: apt.end_time?.slice(0, 5),
        duration: duration > 0 ? duration : 30,
        type: apt.appointment_type || "Appointment",
        status: apt.status as CalendarStatus,
        condition: apt.condition,
      };
    });

    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select(`
        id,
        patient_id,
        appointment_id,
        session_date,
        status,
        patients (
          first_name,
          last_name,
          email,
          phone
        ),
        appointments (
          id,
          appointment_date,
          start_time,
          end_time,
          appointment_type
        )
      `)
      .eq("status", "completed")
      .order("session_date");

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
    }

    const weekEnd = addDays(weekStart, 4);
    const mappedSessions: CalendarItem[] = (sessionsData || [])
      .filter((session: any) => {
        const appointment = Array.isArray(session.appointments)
          ? session.appointments[0]
          : session.appointments;
        const baseDateStr = appointment?.appointment_date || session.session_date;
        if (!baseDateStr) return false;
        const baseDate = parseISO(baseDateStr);
        return isWithinInterval(baseDate, { start: weekStart, end: weekEnd });
      })
      .map((session: any) => {
        const appointment = Array.isArray(session.appointments)
          ? session.appointments[0]
          : session.appointments;

        const baseDate = appointment?.appointment_date || session.session_date;
        const sessionDate = baseDate ? parseISO(baseDate) : new Date();
        const startTimeFromSession = appointment?.start_time || format(sessionDate, "HH:mm");
        const endTimeFromSession = appointment?.end_time;
        const computedDuration =
          endTimeFromSession && startTimeFromSession
            ? parseTimeToMinutes(endTimeFromSession) - parseTimeToMinutes(startTimeFromSession)
            : 60;
        const startTime = startTimeFromSession?.slice(0, 5) || businessHoursRange.start;
        const endTime =
          endTimeFromSession?.slice(0, 5) ||
          minutesToTimeString(parseTimeToMinutes(startTime) + (computedDuration || 60));

        return {
          id: session.id,
          appointmentId: session.appointment_id || appointment?.id,
          sessionId: session.id,
          kind: "session",
          patientId: session.patient_id,
          patientName: session.patients ? `${session.patients.first_name} ${session.patients.last_name}` : "Unknown",
          patientEmail: session.patients?.email || "",
          patientPhone: session.patients?.phone || "",
          date: appointment?.appointment_date || format(sessionDate, "yyyy-MM-dd"),
          time: startTime,
          endTime,
          duration: computedDuration > 0 ? computedDuration : 60,
          type: appointment?.appointment_type || "Session",
          status: "completed",
        };
      });

    setCalendarItems([...mappedAppointments, ...mappedSessions]);
  }, [businessHoursRange.start, businessHoursRange.end, weekStart]);

  useEffect(() => {
    fetchCalendarItems();
  }, [fetchCalendarItems]);

  // Update current time every minute using effective timezone
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getDateInTimeZone(effectiveTimeZone));
    };
    
    // Update immediately
    updateTime();
    
    // Update every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [effectiveTimeZone]);

  // Reset week view when timezone changes to keep cursor aligned
  useEffect(() => {
    setWeekStart(startOfWeek(getDateInTimeZone(effectiveTimeZone), { weekStartsOn: 1 }));
  }, [effectiveTimeZone]);

  // Auto-scroll to business hours start so they fill the visible viewport
  useEffect(() => {
    if (!gridRef) return;
    const startOffset = parseTimeToMinutes(businessHoursRange.start) / 30 * SLOT_HEIGHT;
    gridRef.scrollTo({ top: Math.max(startOffset - SLOT_HEIGHT * 2, 0) });
  }, [businessHoursRange.start, gridRef]);

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const getItemsForSlot = (day: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(day);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 30);

    return calendarItems.filter((item) => {
      const aptDate = parseISO(item.date);
      if (!isSameDay(aptDate, day)) return false;

      const [aptHours, aptMinutes] = item.time.split(":").map(Number);
      const aptStart = new Date(day);
      aptStart.setHours(aptHours, aptMinutes, 0, 0);

      return aptStart >= slotStart && aptStart < slotEnd;
    });
  };

  const getCurrentTimePosition = () => {
    // Get time in the effective timezone
    const { hours, minutes } = getTimeInTimeZone(effectiveTimeZone);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = parseTimeToMinutes(businessHoursRange.start);
    const relativeMinutes = Math.max(0, totalMinutes - startMinutes);
    return (relativeMinutes / 30) * SLOT_HEIGHT;
  };

  const isCurrentTimeVisible = () => {
    const { hours, minutes, date: currentDate } = getTimeInTimeZone(effectiveTimeZone);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = parseTimeToMinutes(businessHoursRange.start);
    const endMinutes = parseTimeToMinutes(businessHoursRange.end);
    const withinHours = totalMinutes >= startMinutes && totalMinutes < endMinutes;
    const withinWeek = weekDays.some((day) => isSameDay(day, currentDate));
    return withinHours && withinWeek;
  };

  const isAppointmentNow = (apt: CalendarItem) => {
    if (apt.kind !== "appointment") return false;
    const aptDate = parseISO(apt.date);
    // Get current date in timezone for day comparison
    const { date: currentDateInTz } = getTimeInTimeZone(effectiveTimeZone);
    if (!isSameDay(aptDate, currentDateInTz)) return false;

    // Get current time in timezone
    const { hours: currentHours, minutes: currentMinutes } = getTimeInTimeZone(effectiveTimeZone);
    const currentTimeInTz = new Date(currentDateInTz);
    currentTimeInTz.setHours(currentHours, currentMinutes, 0, 0);

    const [hours, minutes] = apt.time.split(":").map(Number);
    const aptStart = new Date(currentDateInTz);
    aptStart.setHours(hours, minutes, 0, 0);
    const aptEnd = addMinutes(aptStart, apt.duration);

    return currentTimeInTz >= aptStart && currentTimeInTz < aptEnd;
  };

  const handleStartSession = async (apt: CalendarItem) => {
    if (apt.kind !== "appointment") return;
    const appointmentId = apt.appointmentId || apt.id;
    try {
      await supabase.from("appointments").update({ status: "in_progress" }).eq("id", appointmentId);

      const { data: existingSession, error: sessionLookupError } = await supabase
        .from("sessions")
        .select("id")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      if (sessionLookupError) throw sessionLookupError;

      let sessionId = existingSession?.id;

      if (!sessionId) {
        const { data: newSession, error: sessionCreateError } = await supabase
          .from("sessions")
          .insert({
            patient_id: apt.patientId,
            appointment_id: appointmentId,
            status: "in_progress",
            clinician_name: "Clinician",
          })
          .select("id")
          .single();

        if (sessionCreateError) throw sessionCreateError;
        sessionId = newSession.id;
      } else {
        await supabase.from("sessions").update({ status: "in_progress" }).eq("id", sessionId);
      }

      navigate(`/session-workflow/${appointmentId}`, {
        state: {
          patientId: apt.patientId,
          patientName: apt.patientName,
          appointmentId,
          sessionId,
          condition: apt.condition,
        },
      });
    } catch (error: any) {
      console.error("Failed to start session", error);
      toast({
        title: "Unable to start session",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviousWeek = () => setWeekStart(addDays(weekStart, -7));
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7));
  const handleToday = () =>
    setWeekStart(startOfWeek(getDateInTimeZone(effectiveTimeZone), { weekStartsOn: 1 }));

  // Drag and drop handlers
  const handleDragStart = (apt: CalendarItem) => {
    if (apt.kind !== "appointment") return;
    setDraggedAppointment(apt);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (day: Date, time: string) => {
    if (!draggedAppointment || draggedAppointment.kind !== "appointment") return;

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
      .eq("id", draggedAppointment.appointmentId || draggedAppointment.id);

    if (error) {
      console.error("Error updating appointment:", error);
    } else {
      fetchCalendarItems();
    }

    setDraggedAppointment(null);
  };

  // Resize handlers
  const handleResizeStart = (aptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingAppointment(aptId);
  };

  const handleResizeEnd = async (apt: CalendarItem, newDuration: number) => {
    if (apt.kind !== "appointment") return;
    const [hours, minutes] = apt.time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + newDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    const { error } = await supabase
      .from("appointments")
      .update({ end_time: endTime })
      .eq("id", apt.appointmentId || apt.id);

    if (error) {
      console.error("Error resizing appointment:", error);
    } else {
      fetchCalendarItems();
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
              const { date: currentDateInTz } = getTimeInTimeZone(effectiveTimeZone);
              const isToday = isSameDay(day, currentDateInTz);
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
          <div
            className="relative flex-1 overflow-y-auto"
            ref={setGridRef}
          >
            {/* Current Time Line */}
            {weekDays.some(d => {
              const { date: currentDateInTz } = getTimeInTimeZone(effectiveTimeZone);
              return isSameDay(d, currentDateInTz);
            }) && isCurrentTimeVisible() && (
              <div 
                className="absolute left-[60px] right-0 h-0.5 bg-destructive z-20 pointer-events-none"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-destructive rounded-full" />
              </div>
            )}

            <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1">
              {timeSlots.map((time) => (
                <div key={`row-${time}`} className="contents">
                  <div
                    className="text-xs text-muted-foreground text-right pr-2 flex items-start pt-0.5"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  >
                    {time}
                  </div>

                  {weekDays.map((day, dayIndex) => {
                    const slotItems = getItemsForSlot(day, time);
                    const isBusinessHours = isWithinBusinessHours(day, time);

                    return (
                      <div
                        key={`${dayIndex}-${time}`}
                        className={`border-t border-border/30 relative ${
                          !isBusinessHours ? "bg-muted/30" : ""
                        }`}
                        style={{ minHeight: `${SLOT_HEIGHT}px` }}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day, time)}
                      >
                        {slotItems.map((apt) => {
                          const isNow = isAppointmentNow(apt);
                          const isSession = apt.kind === "session";
                          const isInProgress = apt.status === "in_progress";
                          const heightSlots = Math.ceil(apt.duration / 30);

                          return (
                            <div
                              key={`${apt.kind}-${apt.id}`}
                              draggable={!isSession}
                              onDragStart={() => handleDragStart(apt)}
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setDialogOpen(true);
                              }}
                              className={`absolute left-0 right-0 mx-0.5 p-1.5 rounded-md transition-all hover:shadow-md z-10 ${
                                isSession
                                  ? "bg-muted text-muted-foreground border border-border/60 cursor-default"
                                  : isNow
                                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 cursor-move"
                                  : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 cursor-move"
                              }`}
                              style={{ height: `${heightSlots * SLOT_HEIGHT - 4}px` }}
                            >
                              <div className="flex flex-col h-full gap-0.5">
                                <div className="flex items-center gap-1">
                                  {!isSession && (
                                    <GripVertical className="h-3 w-3 opacity-50 flex-shrink-0" />
                                  )}
                                  <p className="font-medium text-xs truncate flex-1">
                                    {apt.patientName}
                                  </p>
                                  {isSession && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <p className={`text-[10px] truncate ${isNow ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                  {apt.time}
                                  {apt.endTime ? ` - ${apt.endTime}` : ""} · {apt.type}
                                </p>
                                {!isSession && (isNow || isInProgress) && apt.duration >= 60 && (
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
                                    {isInProgress ? "Continue" : "Start"}
                                  </Button>
                                )}
                                {!isSession && (
                                  <div
                                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 rounded-b-md"
                                    onMouseDown={(e) => handleResizeStart(apt.id, e)}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
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
        onAppointmentCreated={fetchCalendarItems}
      />
    </>
  );
}
