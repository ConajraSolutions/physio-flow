import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

interface Patient {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  condition: string;
  avatar?: string;
}

const mockPatients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    lastVisit: "Today",
    condition: "Lower Back Pain",
  },
  {
    id: "2",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    lastVisit: "Yesterday",
    condition: "Knee Rehabilitation",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    lastVisit: "2 days ago",
    condition: "Shoulder Injury",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@example.com",
    lastVisit: "3 days ago",
    condition: "Post-Surgery Recovery",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function RecentPatients() {
  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Recent Patients</CardTitle>
        <Link to="/patients">
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockPatients.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {getInitials(patient.name)}
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {patient.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{patient.condition}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{patient.lastVisit}</span>
                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
