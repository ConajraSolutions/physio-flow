import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientHistory from "./pages/PatientHistory";
import SessionWorkflow from "./pages/SessionWorkflow";
import Exercises from "./pages/Exercises";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import PublicPlan from "./pages/PublicPlan";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { RequireAuth } from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/patients"
            element={
              <RequireAuth>
                <Patients />
              </RequireAuth>
            }
          />
          <Route
            path="/patients/:patientId/history"
            element={
              <RequireAuth>
                <PatientHistory />
              </RequireAuth>
            }
          />
          <Route
            path="/session-workflow/:appointmentId"
            element={
              <RequireAuth>
                <SessionWorkflow />
              </RequireAuth>
            }
          />
          <Route
            path="/exercises"
            element={
              <RequireAuth>
                <Exercises />
              </RequireAuth>
            }
          />
          <Route
            path="/billing"
            element={
              <RequireAuth>
                <Billing />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="/plan/:token" element={<PublicPlan />} />
          <Route path="/logout" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
