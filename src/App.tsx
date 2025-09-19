import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Index from "./pages/Index";
import FindMentors from "./pages/FindMentors";
import BrowseSkills from "./pages/BrowseSkills";
import MySwaps from "./pages/MySwaps";
import Notifications from "./pages/Notifications";
import UserProfile from "./pages/UserProfile";
import StartTeaching from "./pages/StartTeaching";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminSessions from "./pages/AdminSessions";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminBroadcast from "./pages/AdminBroadcast";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
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
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="sessions" element={<AdminSessions />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="broadcast" element={<AdminBroadcast />} />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
