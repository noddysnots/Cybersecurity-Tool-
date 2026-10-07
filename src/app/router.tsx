import { createBrowserRouter } from "react-router-dom";

import { ErrorBoundary } from "@/app/ErrorBoundary";
import { RequireAuth } from "@/app/guards";
import { HomePage } from "@/app/routes/HomePage";
import { LoginPage } from "@/app/routes/LoginPage";
import { LogsPage } from "@/app/routes/LogsPage";
import { NotFoundPage } from "@/app/routes/NotFoundPage";
import { PlaceholderPage } from "@/app/routes/PlaceholderPage";
import { SplashPage } from "@/app/routes/SplashPage";
import { TicketsPage } from "@/app/routes/TicketsPage";
import { TicketWorkspacePage } from "@/app/routes/TicketWorkspacePage";
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
                <TicketsPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/tickets/:id",
            element: (
              <ErrorBoundary>
                <TicketWorkspacePage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/logs",
            element: (
              <ErrorBoundary>
                <LogsPage />
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
