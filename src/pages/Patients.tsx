import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Phone, Mail, Calendar } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  condition: string;
  lastVisit: string;
  nextAppointment: string | null;
  status: "active" | "inactive";
}

const mockPatients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "647-555-1234",
    dob: "1990-03-29",
    condition: "Lower Back Pain",
    lastVisit: "2025-11-28",
    nextAppointment: "2025-12-02",
    status: "active",
  },
  {
    id: "2",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    phone: "647-555-5678",
    dob: "1985-07-15",
    condition: "Knee Rehabilitation",
    lastVisit: "2025-11-27",
    nextAppointment: "2025-12-01",
    status: "active",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "647-555-9012",
    dob: "1978-11-22",
    condition: "Shoulder Injury",
    lastVisit: "2025-11-25",
    nextAppointment: null,
    status: "active",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "647-555-3456",
    dob: "1995-04-10",
    condition: "Post-Surgery Recovery",
    lastVisit: "2025-11-20",
    nextAppointment: "2025-12-05",
    status: "active",
  },
  {
    id: "5",
    name: "James Miller",
    email: "james@example.com",
    phone: "647-555-7890",
    dob: "1982-09-05",
    condition: "Chronic Neck Pain",
    lastVisit: "2025-11-15",
    nextAppointment: null,
    status: "inactive",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <PageHeader
        title="Patients"
        description="Manage your patient records and medical history."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        }
      />

      <Card variant="elevated" className="animate-slide-up">
        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Next Appointment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {getInitials(patient.name)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            DOB: {formatDate(patient.dob)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {patient.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {patient.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{patient.condition}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{formatDate(patient.lastVisit)}</span>
                    </TableCell>
                    <TableCell>
                      {patient.nextAppointment ? (
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatDate(patient.nextAppointment)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === "active" ? "completed" : "secondary"}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Book Appointment</DropdownMenuItem>
                          <DropdownMenuItem>Send Forms</DropdownMenuItem>
                          <DropdownMenuItem>View History</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPatients.length} of {mockPatients.length} patients
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
