import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { WeeklyCalendar } from "@/components/scheduling/WeeklyCalendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back, Dr. Smith. Here's your weekly schedule."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        }
      />

      <WeeklyCalendar />
    </MainLayout>
  );
}
