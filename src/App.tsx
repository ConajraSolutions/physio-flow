import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientHistory from "./pages/PatientHistory";
import Appointments from "./pages/Appointments";
import Sessions from "./pages/Sessions";
import Exercises from "./pages/Exercises";
import Billing from "./pages/Billing";
import Forms from "./pages/Forms";
import Settings from "./pages/Settings";
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
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
