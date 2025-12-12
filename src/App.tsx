import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientHistory from "./pages/PatientHistory";
import SessionWorkflow from "./pages/SessionWorkflow";
import Exercises from "./pages/Exercises";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import PublicPlan from "./pages/PublicPlan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:patientId/history" element={<PatientHistory />} />
          <Route path="/session-workflow/:appointmentId" element={<SessionWorkflow />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/plan/:token" element={<PublicPlan />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
