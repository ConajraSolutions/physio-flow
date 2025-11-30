import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  patientName: string;
  time: string;
  duration: number; // in minutes
  type: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  onClick: () => void;
}

const statusColors = {
  scheduled: "bg-primary/10 border-primary/30 hover:bg-primary/20",
  completed: "bg-success/10 border-success/30 hover:bg-success/20",
  cancelled: "bg-destructive/10 border-destructive/30 hover:bg-destructive/20",
  pending: "bg-warning/10 border-warning/30 hover:bg-warning/20",
};

const statusTextColors = {
  scheduled: "text-primary",
  completed: "text-success",
  cancelled: "text-destructive",
  pending: "text-warning",
};

export function AppointmentCard({
  patientName,
  time,
  duration,
  type,
  status,
  onClick,
}: AppointmentCardProps) {
  // Calculate height based on duration (1 hour = 60px minimum)
  const height = Math.max(duration, 30);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-2 rounded-lg border-l-4 transition-all duration-200 cursor-pointer",
        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50",
        statusColors[status]
      )}
      style={{ minHeight: `${height}px` }}
    >
      <p className={cn("font-medium text-sm truncate", statusTextColors[status])}>
        {patientName}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      <p className="text-xs text-muted-foreground truncate">{type}</p>
    </button>
  );
}
