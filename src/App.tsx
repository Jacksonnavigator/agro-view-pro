// Main application component with routing configuration and lazy loading
import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy loaded pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Devices = lazy(() => import("./pages/Devices"));
const DeviceDetails = lazy(() => import("./pages/DeviceDetails"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Plots = lazy(() => import("./pages/Plots"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Compare = lazy(() => import("./pages/Compare"));
const DebugData = lazy(() => import("./pages/DebugData"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />

              {/* Protected dashboard routes with lazy loading */}
              <Route element={<DashboardLayout />}>
                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Dashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/devices"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Devices />
                    </Suspense>
                  }
                />
                <Route
                  path="/device/:id"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <DeviceDetails />
                    </Suspense>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Alerts />
                    </Suspense>
                  }
                />
                <Route
                  path="/plots"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Plots />
                    </Suspense>
                  }
                />
                <Route
                  path="/compare"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Compare />
                    </Suspense>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Reports />
                    </Suspense>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Settings />
                    </Suspense>
                  }
                />

              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
