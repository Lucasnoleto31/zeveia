import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy-loaded pages
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const LeadDetailPage = lazy(() => import("./pages/LeadDetailPage"));
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const ClientDetailPage = lazy(() => import("./pages/ClientDetailPage"));
const RevenuesPage = lazy(() => import("./pages/RevenuesPage"));
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const PartnersPage = lazy(() => import("./pages/PartnersPage"));
const PartnerDetailPage = lazy(() => import("./pages/PartnerDetailPage"));
const PlatformCostsPage = lazy(() => import("./pages/PlatformCostsPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const AgendaPage = lazy(() => import("./pages/AgendaPage"));
const FunnelReportPage = lazy(() => import("./pages/FunnelReportPage"));
const OpportunitiesReportPage = lazy(() => import("./pages/OpportunitiesReportPage"));
const PerformanceReportPage = lazy(() => import("./pages/PerformanceReportPage"));
const PartnerROIReportPage = lazy(() => import("./pages/PartnerROIReportPage"));
const ClientsReportPage = lazy(() => import("./pages/ClientsReportPage"));
const RevenuesReportPage = lazy(() => import("./pages/RevenuesReportPage"));
const ContractsReportPage = lazy(() => import("./pages/ContractsReportPage"));
const PlatformsReportPage = lazy(() => import("./pages/PlatformsReportPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const MacroEventsPage = lazy(() => import("./pages/MacroEventsPage"));
const RetentionDashboardPage = lazy(() => import("./pages/RetentionDashboardPage"));
const InfluencerPipelinePage = lazy(() => import("./pages/InfluencerPipelinePage"));
const InfluencerDetailPage = lazy(() => import("./pages/InfluencerDetailPage"));
const WealthSimulatorPage = lazy(() => import("./pages/WealthSimulatorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // garbage collect after 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
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
                  <Route path="/leads/:id" element={<ProtectedRoute><LeadDetailPage /></ProtectedRoute>} />
                  <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
                  <Route path="/clients/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
                  <Route path="/revenues" element={<ProtectedRoute><RevenuesPage /></ProtectedRoute>} />
                  <Route path="/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
                  <Route path="/partners" element={<ProtectedRoute><PartnersPage /></ProtectedRoute>} />
                  <Route path="/partners/:id" element={<ProtectedRoute><PartnerDetailPage /></ProtectedRoute>} />
                  <Route path="/platforms" element={<ProtectedRoute><PlatformCostsPage /></ProtectedRoute>} />
                  <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
                  <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
                  <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
                  <Route path="/macro-events" element={<ProtectedRoute><MacroEventsPage /></ProtectedRoute>} />
                  <Route path="/retention" element={<ProtectedRoute><RetentionDashboardPage /></ProtectedRoute>} />
                  <Route path="/influencers" element={<ProtectedRoute><InfluencerPipelinePage /></ProtectedRoute>} />
                  <Route path="/influencers/:id" element={<ProtectedRoute><InfluencerDetailPage /></ProtectedRoute>} />
                  <Route path="/wealth" element={<ProtectedRoute><WealthSimulatorPage /></ProtectedRoute>} />
                  <Route path="/reports/funnel" element={<ProtectedRoute><FunnelReportPage /></ProtectedRoute>} />
                  <Route path="/reports/opportunities" element={<ProtectedRoute><OpportunitiesReportPage /></ProtectedRoute>} />
                  <Route path="/reports/performance" element={<ProtectedRoute><PerformanceReportPage /></ProtectedRoute>} />
                  <Route path="/reports/roi" element={<ProtectedRoute><PartnerROIReportPage /></ProtectedRoute>} />
                  <Route path="/reports/clients" element={<ProtectedRoute><ClientsReportPage /></ProtectedRoute>} />
                  <Route path="/reports/revenues" element={<ProtectedRoute><RevenuesReportPage /></ProtectedRoute>} />
                  <Route path="/reports/contracts" element={<ProtectedRoute><ContractsReportPage /></ProtectedRoute>} />
                  <Route path="/reports/platforms" element={<ProtectedRoute><PlatformsReportPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute requireSocio><SettingsPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
