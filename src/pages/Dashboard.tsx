import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FormCompletionChart } from "@/components/dashboard/FormCompletionChart";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  FileCheck, 
  DollarSign,
  Plus 
} from "lucide-react";

export default function Dashboard() {
  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back, Dr. Smith. Here's what's happening today."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={248}
          change="+12 this month"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Today's Appointments"
          value={8}
          change="2 remaining"
          changeType="neutral"
          icon={Calendar}
        />
        <StatCard
          title="Forms Completed"
          value="87%"
          change="+5% from last week"
          changeType="positive"
          icon={FileCheck}
        />
        <StatCard
          title="Revenue (MTD)"
          value="$12,450"
          change="+18% from last month"
          changeType="positive"
          icon={DollarSign}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <AppointmentsList />
          <RecentPatients />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <QuickActions />
          <FormCompletionChart />
        </div>
      </div>
    </MainLayout>
  );
}
