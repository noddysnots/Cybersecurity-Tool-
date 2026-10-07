import { createBrowserRouter } from "react-router-dom";

import { ErrorBoundary } from "@/app/ErrorBoundary";
import { RequireAuth } from "@/app/guards";
import { HomePage } from "@/app/routes/HomePage";
import { LoginPage } from "@/app/routes/LoginPage";
import { NotFoundPage } from "@/app/routes/NotFoundPage";
import { PlaceholderPage } from "@/app/routes/PlaceholderPage";
import { SplashPage } from "@/app/routes/SplashPage";
import { TicketPlaceholderPage } from "@/app/routes/TicketPlaceholderPage";
import { AppShell } from "@/components/shell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SplashPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/home",
            element: (
              <ErrorBoundary>
                <HomePage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/tickets",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Tickets"
                  path="/tickets"
                  description="Ticket card grid and table arrive in Phase 4."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/tickets/:id",
            element: (
              <ErrorBoundary>
                <TicketPlaceholderPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/logs",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Logs"
                  path="/logs"
                  description="Log explorer arrives in Phase 5."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/policies",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Policies"
                  path="/policies"
                  description="Security and decryption policy tables arrive in Phase 8."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/objects",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Objects"
                  path="/objects"
                  description="Address, service, and application objects arrive in Phase 8."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/remote-networks",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Remote networks"
                  path="/remote-networks"
                  description="Branch tunnel status arrives in Phase 8."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/mobile-users",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Mobile users"
                  path="/mobile-users"
                  description="GlobalProtect user list arrives in Phase 8."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/config-audit",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Config audit"
                  path="/config-audit"
                  description="Config change history arrives in Phase 8."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/troubleshooting",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Troubleshooting"
                  path="/troubleshooting"
                  description="Policy match, ping, traceroute, and tunnel tools arrive in Phase 6."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/brief",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Brief"
                  path="/brief"
                  description="Problem, persona, and review notes arrive in Phase 9."
                />
              </ErrorBoundary>
            ),
          },
          {
            path: "/alerts",
            element: (
              <ErrorBoundary>
                <PlaceholderPage
                  title="Platform alerts"
                  path="/alerts"
                  description="Open platform alerts for Acme Corp. Full alert console arrives later."
                />
              </ErrorBoundary>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
