import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LeadsPage from "./pages/LeadsPage";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import RevenuesPage from "./pages/RevenuesPage";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
              <Route path="/clients/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
              <Route path="/revenues" element={<ProtectedRoute><RevenuesPage /></ProtectedRoute>} />
              <Route path="/partners" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/partners/:id" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/platforms" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/reports/funnel" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/reports/performance" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/reports/roi" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requireSocio><ComingSoon /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
