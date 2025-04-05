import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import AdminPage from "@/pages/AdminPage";
import PanelPage from "@/pages/PanelPage";
import QueuePage from "@/pages/QueuePage";
import EmailQueuePage from "@/pages/EmailQueuePage";
import HomePage from "@/pages/HomePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/panels" component={AdminPage} />
      <Route path="/admin/pipeline" component={AdminPage} />
      <Route path="/admin/rooms" component={AdminPage} />
      <Route path="/admin/sheets" component={AdminPage} />
      <Route path="/admin/feedback" component={AdminPage} />
      <Route path="/admin/reports" component={AdminPage} />
      <Route path="/admin/users" component={AdminPage} />
      <Route path="/panel" component={PanelPage} />
      <Route path="/queue/:serialNo" component={QueuePage} />
      <Route path="/queue-email/:email" component={EmailQueuePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
