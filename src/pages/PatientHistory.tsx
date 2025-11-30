import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, FileText, User } from "lucide-react";

// Mock session history data
const mockSessions = [
  {
    id: "s1",
    date: "Nov 28, 2025",
    time: "10:00 AM",
    type: "Follow-up",
    clinician: "Dr. Smith",
    notes: "Patient showed improvement in range of motion. Continued exercises prescribed.",
    status: "completed",
  },
  {
    id: "s2",
    date: "Nov 21, 2025",
    time: "09:30 AM",
    type: "Therapy Session",
    clinician: "Dr. Smith",
    notes: "Manual therapy and exercises. Patient reported 30% reduction in pain.",
    status: "completed",
  },
  {
    id: "s3",
    date: "Nov 14, 2025",
    time: "11:00 AM",
    type: "Initial Assessment",
    clinician: "Dr. Smith",
    notes: "Initial evaluation completed. Diagnosed with lower back pain. Treatment plan established.",
    status: "completed",
  },
];

const mockPatient = {
  id: "p1",
  name: "John Doe",
  email: "john@example.com",
  phone: "647-555-1234",
  condition: "Lower Back Pain",
  dob: "March 29, 1990",
};

export default function PatientHistory() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageHeader
        title="Session History"
        description={`Viewing history for ${mockPatient.name}`}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      {/* Patient Info Card */}
      <Card variant="elevated" className="mb-6 animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
              {mockPatient.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">{mockPatient.name}</h2>
              <p className="text-muted-foreground">{mockPatient.condition}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{mockPatient.email}</span>
                <span>•</span>
                <span>{mockPatient.phone}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-3xl font-bold text-primary">{mockSessions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Timeline */}
      <div className="space-y-4">
        {mockSessions.map((session, index) => (
          <Card
            key={session.id}
            variant="interactive"
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{session.type}</h3>
                      <Badge variant="completed">{session.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {session.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {session.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {session.clinician}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{session.notes}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
