import { createBrowserRouter } from "react-router-dom";

import { ErrorBoundary } from "@/app/ErrorBoundary";
import { RequireAuth } from "@/app/guards";
import { BriefPage } from "@/app/routes/BriefPage";
import { ConfigAuditPage } from "@/app/routes/ConfigAuditPage";
import { HomePage } from "@/app/routes/HomePage";
import { LoginPage } from "@/app/routes/LoginPage";
import { LogsPage } from "@/app/routes/LogsPage";
import { MobileUsersPage } from "@/app/routes/MobileUsersPage";
import { NotFoundPage } from "@/app/routes/NotFoundPage";
import { ObjectsPage } from "@/app/routes/ObjectsPage";
import { PlaceholderPage } from "@/app/routes/PlaceholderPage";
import { PoliciesPage } from "@/app/routes/PoliciesPage";
import { RemoteNetworksPage } from "@/app/routes/RemoteNetworksPage";
import { SplashPage } from "@/app/routes/SplashPage";
import { TicketsPage } from "@/app/routes/TicketsPage";
import { TicketWorkspacePage } from "@/app/routes/TicketWorkspacePage";
import { TroubleshootingPage } from "@/app/routes/TroubleshootingPage";
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
                <PoliciesPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/objects",
            element: (
              <ErrorBoundary>
                <ObjectsPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/remote-networks",
            element: (
              <ErrorBoundary>
                <RemoteNetworksPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/mobile-users",
            element: (
              <ErrorBoundary>
                <MobileUsersPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/config-audit",
            element: (
              <ErrorBoundary>
                <ConfigAuditPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/troubleshooting",
            element: (
              <ErrorBoundary>
                <TroubleshootingPage />
              </ErrorBoundary>
            ),
          },
          {
            path: "/brief",
            element: (
              <ErrorBoundary>
                <BriefPage />
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
