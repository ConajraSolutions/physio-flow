import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back, Dr. Smith. Here's your schedule for the next 3 days."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        }
      />

      <CalendarView />
    </MainLayout>
  );
}
