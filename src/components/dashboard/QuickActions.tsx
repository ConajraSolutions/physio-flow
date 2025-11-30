import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  ClipboardList,
  Dumbbell,
  Send
} from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    label: "New Patient",
    icon: UserPlus,
    href: "/patients/new",
    description: "Register a new patient",
  },
  {
    label: "Book Appointment",
    icon: CalendarPlus,
    href: "/appointments/new",
    description: "Schedule an appointment",
  },
  {
    label: "Start Session",
    icon: ClipboardList,
    href: "/sessions/new",
    description: "Begin consultation",
  },
  {
    label: "Create Exercise Plan",
    icon: Dumbbell,
    href: "/exercises/new",
    description: "Build treatment plan",
  },
  {
    label: "Send Forms",
    icon: Send,
    href: "/forms/send",
    description: "Email patient forms",
  },
  {
    label: "View Reports",
    icon: FileText,
    href: "/reports",
    description: "Analytics & reports",
  },
];

export function QuickActions() {
  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-primary/5"
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
