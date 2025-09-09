import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BoardProvider } from "@/lib/board-context";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Header } from "@/components/header";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BoardPage from "@/pages/board";
import BoardEdit from "@/pages/board-edit";
import Dashboard from "@/pages/dashboard";
import UserDashboard from "@/pages/user-dashboard";
import UserManagement from "@/pages/user-management";
import AccountSettings from "@/pages/account-settings";
import Login from "@/pages/login";
import Register from "@/pages/register";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <Login />
            </main>
          </>
        )}
      </Route>
      <Route path="/register">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <Register />
            </main>
          </>
        )}
      </Route>
      <ProtectedRoute path="/">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <Home />
            </main>
          </>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/my-dashboard">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <UserDashboard />
            </main>
          </>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/account/settings">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <AccountSettings />
            </main>
          </>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/dashboard">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <Dashboard />
            </main>
          </>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/users/manage">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <UserManagement />
            </main>
          </>
        )}
      </ProtectedRoute>
      <ProtectedRoute path="/board/:id">
        {() => <BoardPage />}
      </ProtectedRoute>
      <ProtectedRoute path="/board/:id/edit">
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <BoardEdit />
            </main>
          </>
        )}
      </ProtectedRoute>
      <Route>
        {() => (
          <>
            <Header />
            <main className="flex-1">
              <NotFound />
            </main>
          </>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BoardProvider>
          <div className="flex flex-col min-h-screen">
            <Router />
          </div>
          <Toaster />
        </BoardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
