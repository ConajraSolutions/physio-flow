import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  TrendingUp,
  FileText,
} from "lucide-react";

interface Claim {
  id: string;
  patientName: string;
  service: string;
  amount: number;
  insurer: string;
  submissionDate: string;
  status: "pending" | "submitted" | "paid" | "denied";
  method: "EDT" | "Manual";
}

const mockClaims: Claim[] = [
  {
    id: "CLM-001",
    patientName: "John Doe",
    service: "Initial Assessment",
    amount: 150,
    insurer: "Sun Life",
    submissionDate: "2025-11-30",
    status: "submitted",
    method: "EDT",
  },
  {
    id: "CLM-002",
    patientName: "Sarah Wilson",
    service: "Follow-up Session",
    amount: 95,
    insurer: "Manulife",
    submissionDate: "2025-11-29",
    status: "paid",
    method: "EDT",
  },
  {
    id: "CLM-003",
    patientName: "Michael Brown",
    service: "Therapy Session",
    amount: 120,
    insurer: "Great-West Life",
    submissionDate: "2025-11-28",
    status: "pending",
    method: "Manual",
  },
  {
    id: "CLM-004",
    patientName: "Emily Davis",
    service: "Re-evaluation",
    amount: 130,
    insurer: "Blue Cross",
    submissionDate: "2025-11-27",
    status: "paid",
    method: "EDT",
  },
  {
    id: "CLM-005",
    patientName: "James Miller",
    service: "Follow-up Session",
    amount: 95,
    insurer: "Desjardins",
    submissionDate: "2025-11-26",
    status: "denied",
    method: "Manual",
  },
];

const statusConfig = {
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  submitted: { icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  paid: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  denied: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function Billing() {
  const totalRevenue = mockClaims
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingAmount = mockClaims
    .filter((c) => c.status === "pending" || c.status === "submitted")
    .reduce((sum, c) => sum + c.amount, 0);
  const deniedAmount = mockClaims
    .filter((c) => c.status === "denied")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <MainLayout>
      <PageHeader
        title="Billing"
        description="Manage insurance claims and track payments."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Claim
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue (MTD)
                </p>
                <p className="text-3xl font-semibold text-foreground mt-1">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Claims
                </p>
                <p className="text-3xl font-semibold text-foreground mt-1">
                  ${pendingAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Denied Claims
                </p>
                <p className="text-3xl font-semibold text-foreground mt-1">
                  ${deniedAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Collection Rate
                </p>
                <p className="text-3xl font-semibold text-foreground mt-1">
                  87%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Claims</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search claims..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClaims.map((claim) => {
                  const StatusIcon = statusConfig[claim.status].icon;

                  return (
                    <TableRow key={claim.id} className="group">
                      <TableCell className="font-mono text-sm">
                        {claim.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {claim.patientName}
                      </TableCell>
                      <TableCell>{claim.service}</TableCell>
                      <TableCell>{claim.insurer}</TableCell>
                      <TableCell className="font-medium">
                        ${claim.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            claim.method === "EDT" ? "completed" : "secondary"
                          }
                          className="text-xs"
                        >
                          {claim.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            statusConfig[claim.status].bg
                          } ${statusConfig[claim.status].color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {claim.status.charAt(0).toUpperCase() +
                            claim.status.slice(1)}
                        </div>
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
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Resubmit</DropdownMenuItem>
                            <DropdownMenuItem>Download Invoice</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
