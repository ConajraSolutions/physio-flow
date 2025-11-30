import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Form {
  id: string;
  name: string;
  type: string;
  patient: string;
  sentDate: string;
  dueDate: string;
  status: "completed" | "pending" | "overdue";
  completedAt?: string;
}

const mockForms: Form[] = [
  {
    id: "1",
    name: "Patient Consent Form",
    type: "Consent",
    patient: "John Doe",
    sentDate: "2025-11-28",
    dueDate: "2025-12-02",
    status: "completed",
    completedAt: "2025-11-29",
  },
  {
    id: "2",
    name: "Medical History Questionnaire",
    type: "Medical History",
    patient: "John Doe",
    sentDate: "2025-11-28",
    dueDate: "2025-12-02",
    status: "pending",
  },
  {
    id: "3",
    name: "Initial Assessment Form",
    type: "Assessment",
    patient: "Sarah Wilson",
    sentDate: "2025-11-27",
    dueDate: "2025-12-01",
    status: "completed",
    completedAt: "2025-11-28",
  },
  {
    id: "4",
    name: "Insurance Information Form",
    type: "Insurance",
    patient: "Michael Brown",
    sentDate: "2025-11-25",
    dueDate: "2025-11-28",
    status: "overdue",
  },
  {
    id: "5",
    name: "Pain Assessment Scale",
    type: "Assessment",
    patient: "Emily Davis",
    sentDate: "2025-11-26",
    dueDate: "2025-12-05",
    status: "pending",
  },
];

const formTemplates = [
  { id: "1", name: "Patient Consent Form", category: "Required" },
  { id: "2", name: "Medical History Questionnaire", category: "Required" },
  { id: "3", name: "Insurance Information Form", category: "Required" },
  { id: "4", name: "Initial Assessment Form", category: "Assessment" },
  { id: "5", name: "Pain Assessment Scale", category: "Assessment" },
  { id: "6", name: "Functional Outcome Survey", category: "Assessment" },
];

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/10",
    label: "Completed",
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Pending",
  },
  overdue: {
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Overdue",
  },
};

export default function Forms() {
  const completedCount = mockForms.filter((f) => f.status === "completed").length;
  const pendingCount = mockForms.filter((f) => f.status === "pending").length;
  const overdueCount = mockForms.filter((f) => f.status === "overdue").length;
  const totalCount = mockForms.length;
  const completionRate = Math.round((completedCount / totalCount) * 100);

  return (
    <MainLayout>
      <PageHeader
        title="Forms"
        description="Manage patient intake forms and documentation."
        actions={
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Send Forms
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card variant="elevated" className="animate-slide-up">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10 text-success">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {completedCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {pendingCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {overdueCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forms List */}
          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Forms</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search forms..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockForms.map((form) => {
                const status = statusConfig[form.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={form.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{form.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {form.patient} • {form.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(form.dueDate).toLocaleDateString()}
                        </p>
                        {form.completedAt && (
                          <p className="text-xs text-success">
                            Completed:{" "}
                            {new Date(form.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </div>
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Form
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Resend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Completion Rate */}
          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{completionRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {completedCount} of {totalCount} forms completed
                </p>
              </div>
              <Progress value={completionRate} className="h-2" />
            </CardContent>
          </Card>

          {/* Form Templates */}
          <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Form Templates</CardTitle>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {formTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{template.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
