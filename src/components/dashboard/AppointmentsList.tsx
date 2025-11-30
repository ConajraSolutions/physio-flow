import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientName: "John Doe",
    time: "09:00 AM",
    type: "Initial Assessment",
    status: "scheduled",
  },
  {
    id: "2",
    patientName: "Sarah Wilson",
    time: "10:30 AM",
    type: "Follow-up",
    status: "scheduled",
  },
  {
    id: "3",
    patientName: "Michael Brown",
    time: "11:30 AM",
    type: "Therapy Session",
    status: "pending",
  },
  {
    id: "4",
    patientName: "Emily Davis",
    time: "02:00 PM",
    type: "Re-evaluation",
    status: "scheduled",
  },
  {
    id: "5",
    patientName: "James Miller",
    time: "03:30 PM",
    type: "Follow-up",
    status: "scheduled",
  },
];

export function AppointmentsList() {
  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Today's Appointments</CardTitle>
        <Link to="/appointments">
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{appointment.patientName}</p>
                <p className="text-sm text-muted-foreground">{appointment.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{appointment.time}</span>
              </div>
              <Badge variant={appointment.status}>{appointment.status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
