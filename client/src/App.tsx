import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SharedCard from "./pages/SharedCard";
import Analytics from "./pages/Analytics";
import CRM from "./pages/CRM";
import EmailDelivery from "./pages/EmailDelivery";
import Workflows from "./pages/Workflows";
import { Pricing } from "./pages/Pricing";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import ContactsDashboard from "./pages/ContactsDashboard";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/crm"} component={CRM} />
      <Route path={"/email-delivery"} component={EmailDelivery} />
      <Route path={"/workflows"} component={Workflows} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/subscription"} component={SubscriptionDashboard} />
      <Route path={"/contacts"} component={ContactsDashboard} />
      <Route path={"/view"} component={SharedCard} />
      <Route path={"/share/:token"} component={SharedCard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
