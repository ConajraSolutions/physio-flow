import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  endTime: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  clinician: string;
}

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

const mockAppointments: Record<string, Appointment[]> = {
  "2025-11-30": [
    {
      id: "1",
      patientName: "John Doe",
      time: "09:00",
      endTime: "10:00",
      type: "Initial Assessment",
      status: "scheduled",
      clinician: "Dr. Smith",
    },
    {
      id: "2",
      patientName: "Sarah Wilson",
      time: "10:30",
      endTime: "11:00",
      type: "Follow-up",
      status: "scheduled",
      clinician: "Dr. Smith",
    },
    {
      id: "3",
      patientName: "Michael Brown",
      time: "11:30",
      endTime: "12:30",
      type: "Therapy Session",
      status: "pending",
      clinician: "Dr. Smith",
    },
    {
      id: "4",
      patientName: "Emily Davis",
      time: "14:00",
      endTime: "15:00",
      type: "Re-evaluation",
      status: "scheduled",
      clinician: "Dr. Smith",
    },
    {
      id: "5",
      patientName: "James Miller",
      time: "15:30",
      endTime: "16:00",
      type: "Follow-up",
      status: "scheduled",
      clinician: "Dr. Smith",
    },
  ],
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(date: Date) {
  const week = [];
  const current = new Date(date);
  current.setDate(current.getDate() - current.getDay());

  for (let i = 0; i < 7; i++) {
    week.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return week;
}

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDates = getWeekDates(currentDate);
  const selectedDateKey = formatDateKey(selectedDate);
  const dayAppointments = mockAppointments[selectedDateKey] || [];

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Appointments"
        description="Manage your schedule and patient appointments."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        }
      />

      <Tabs defaultValue="week" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="min-w-[200px]"
              onClick={() => setCurrentDate(new Date())}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="week" className="space-y-6">
          {/* Week Calendar Header */}
          <Card variant="elevated" className="animate-slide-up">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, index) => {
                  const isSelected = formatDateKey(date) === selectedDateKey;
                  const isToday = formatDateKey(date) === formatDateKey(new Date());
                  const hasAppointments = mockAppointments[formatDateKey(date)]?.length > 0;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : isToday
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <span className="text-xs font-medium opacity-70">
                        {weekDays[date.getDay()]}
                      </span>
                      <span className="text-lg font-semibold">{date.getDate()}</span>
                      {hasAppointments && !isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Time slots */}
                    <div className="space-y-0">
                      {timeSlots.map((time) => {
                        const appointment = dayAppointments.find((a) => a.time === time);

                        return (
                          <div
                            key={time}
                            className="flex items-stretch border-t border-border min-h-[60px]"
                          >
                            <div className="w-20 py-2 text-sm text-muted-foreground shrink-0">
                              {time}
                            </div>
                            <div className="flex-1 py-1 px-2">
                              {appointment && (
                                <div className="h-full p-3 rounded-lg bg-primary/10 border-l-4 border-primary hover:bg-primary/15 transition-colors cursor-pointer">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {appointment.patientName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {appointment.type}
                                      </p>
                                    </div>
                                    <Badge variant={appointment.status}>
                                      {appointment.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      {appointment.time} - {appointment.endTime}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <User className="h-3.5 w-3.5" />
                                      {appointment.clinician}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Upcoming */}
            <div className="space-y-6">
              <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-muted-foreground">Total Appointments</span>
                    <span className="text-2xl font-semibold text-foreground">
                      {dayAppointments.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="text-2xl font-semibold text-success">
                      {dayAppointments.filter((a) => a.status === "completed").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-2xl font-semibold text-warning">
                      {dayAppointments.filter((a) => a.status === "pending").length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Next Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                  {dayAppointments.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                          {dayAppointments[0].patientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {dayAppointments[0].patientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {dayAppointments[0].type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {dayAppointments[0].time} - {dayAppointments[0].endTime}
                        </span>
                      </div>
                      <Button className="w-full">Start Session</Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No appointments scheduled
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="day">
          <Card variant="elevated">
            <CardContent className="p-12 text-center text-muted-foreground">
              Day view coming soon
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card variant="elevated">
            <CardContent className="p-12 text-center text-muted-foreground">
              Month view coming soon
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
