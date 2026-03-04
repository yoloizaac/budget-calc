import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import Dashboard from "@/pages/Dashboard";
import DailyLog from "@/pages/DailyLog";
import Transactions from "@/pages/Transactions";
import FundingPage from "@/pages/FundingPage";
import RentTracker from "@/pages/RentTracker";
import SettingsPage from "@/pages/SettingsPage";
import ChatPage from "@/pages/ChatPage";
import AdminPage from "@/pages/AdminPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function FontSizeManager() {
  const { data: settings } = useSettings();
  useEffect(() => {
    const size = (settings as any)?.font_size || 'default';
    document.documentElement.classList.remove('font-small', 'font-default', 'font-large');
    document.documentElement.classList.add(`font-${size}`);
  }, [settings]);
  return null;
}

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FontSizeManager />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route element={<ProtectedRoutes />}>
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/daily" element={<ErrorBoundary><DailyLog /></ErrorBoundary>} />
                <Route path="/transactions" element={<ErrorBoundary><Transactions /></ErrorBoundary>} />
                <Route path="/funding" element={<ErrorBoundary><FundingPage /></ErrorBoundary>} />
                <Route path="/rent" element={<ErrorBoundary><RentTracker /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                <Route path="/chat" element={<ErrorBoundary><ChatPage /></ErrorBoundary>} />
                <Route path="/admin" element={<ErrorBoundary><AdminPage /></ErrorBoundary>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
