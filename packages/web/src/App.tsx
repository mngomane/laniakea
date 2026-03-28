import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { AdminLayout } from "./components/admin/AdminLayout.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { AchievementsPage } from "./pages/AchievementsPage.js";
import { LeaderboardPage } from "./pages/LeaderboardPage.js";
import { TeamsPage } from "./pages/TeamsPage.js";
import { CreateTeamPage } from "./pages/CreateTeamPage.js";
import { TeamDetailPage } from "./pages/TeamDetailPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage.js";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage.js";
import { AdminTeamsPage } from "./pages/admin/AdminTeamsPage.js";
import { AdminAchievementsPage } from "./pages/admin/AdminAchievementsPage.js";
import { AuthCallbackPage } from "./pages/AuthCallbackPage.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Layout>
                  <AchievementsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <Layout>
                <LeaderboardPage />
              </Layout>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateTeamPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:slug"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminLayout>
                    <AdminDashboardPage />
                  </AdminLayout>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminLayout>
                    <AdminUsersPage />
                  </AdminLayout>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminLayout>
                    <AdminTeamsPage />
                  </AdminLayout>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/achievements"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminLayout>
                    <AdminAchievementsPage />
                  </AdminLayout>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
