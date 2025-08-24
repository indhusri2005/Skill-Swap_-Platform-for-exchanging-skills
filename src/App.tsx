import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Index from "./pages/Index";
import FindMentors from "./pages/FindMentors";
import BrowseSkills from "./pages/BrowseSkills";
import MySwaps from "./pages/MySwaps";
import Notifications from "./pages/Notifications";
import UserProfile from "./pages/UserProfile";
import StartTeaching from "./pages/StartTeaching";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/find-mentors" element={
                <ProtectedRoute>
                  <FindMentors />
                </ProtectedRoute>
              } />
              <Route path="/browse-skills" element={
                <ProtectedRoute>
                  <BrowseSkills />
                </ProtectedRoute>
              } />
              <Route path="/my-swaps" element={
                <ProtectedRoute>
                  <MySwaps />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/start-teaching" element={
                <ProtectedRoute>
                  <StartTeaching />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
