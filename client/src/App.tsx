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
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/my-dashboard" component={UserDashboard} />
      <ProtectedRoute path="/account/settings" component={AccountSettings} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/users/manage" component={UserManagement} />
      <ProtectedRoute path="/board/:id" component={BoardPage} />
      <ProtectedRoute path="/board/:id/edit" component={BoardEdit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BoardProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
          </div>
          <Toaster />
        </BoardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
