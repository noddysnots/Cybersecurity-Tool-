import { createBrowserRouter, Navigate } from "react-router-dom";

import { NotFoundPage } from "@/app/routes/NotFoundPage";
import { PlaceholderPage } from "@/app/routes/PlaceholderPage";
import { TicketPlaceholderPage } from "@/app/routes/TicketPlaceholderPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PlaceholderPage
        title="Developer splash"
        path="/"
        description="Splash sequence arrives in Phase 2. Continuing to login for now."
      />
    ),
  },
  {
    path: "/login",
    element: (
      <PlaceholderPage
        title="Login"
        path="/login"
        description="Sign-in arrives in Phase 2. Demo credentials will be admin / 12345."
      />
    ),
  },
  {
    path: "/home",
    element: (
      <PlaceholderPage
        title="Home"
        path="/home"
        description="Mission-control home grid arrives in Phase 3."
      />
    ),
  },
  {
    path: "/tickets",
    element: (
      <PlaceholderPage
        title="Tickets"
        path="/tickets"
        description="Ticket card grid and table arrive in Phase 4."
      />
    ),
  },
  {
    path: "/tickets/:id",
    element: <TicketPlaceholderPage />,
  },
  {
    path: "/logs",
    element: (
      <PlaceholderPage
        title="Logs"
        path="/logs"
        description="Log explorer arrives in Phase 5."
      />
    ),
  },
  {
    path: "/policies",
    element: (
      <PlaceholderPage
        title="Policies"
        path="/policies"
        description="Security and decryption policy tables arrive in Phase 8."
      />
    ),
  },
  {
    path: "/objects",
    element: (
      <PlaceholderPage
        title="Objects"
        path="/objects"
        description="Address, service, and application objects arrive in Phase 8."
      />
    ),
  },
  {
    path: "/remote-networks",
    element: (
      <PlaceholderPage
        title="Remote networks"
        path="/remote-networks"
        description="Branch tunnel status arrives in Phase 8."
      />
    ),
  },
  {
    path: "/mobile-users",
    element: (
      <PlaceholderPage
        title="Mobile users"
        path="/mobile-users"
        description="GlobalProtect user list arrives in Phase 8."
      />
    ),
  },
  {
    path: "/config-audit",
    element: (
      <PlaceholderPage
        title="Config audit"
        path="/config-audit"
        description="Config change history arrives in Phase 8."
      />
    ),
  },
  {
    path: "/troubleshooting",
    element: (
      <PlaceholderPage
        title="Troubleshooting"
        path="/troubleshooting"
        description="Policy match, ping, traceroute, and tunnel tools arrive in Phase 6."
      />
    ),
  },
  {
    path: "/brief",
    element: (
      <PlaceholderPage
        title="Brief"
        path="/brief"
        description="Problem, persona, and review notes arrive in Phase 9."
      />
    ),
  },
  {
    path: "/alerts",
    element: <Navigate to="/tickets" replace />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
