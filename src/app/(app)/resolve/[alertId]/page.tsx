import alertsData from "@/data/alerts.json";
import { ResolveAlertNotFound, ResolveWorkspace } from "@/components/resolve";
import type { Alert } from "@/types";

const alerts = alertsData as Alert[];

export function generateStaticParams() {
  return alerts.map((alert) => ({ alertId: alert.id }));
}

export default async function Page({
  params,
}: PageProps<"/resolve/[alertId]">) {
  const { alertId } = await params;
  const alert = alerts.find((item) => item.id === alertId);
  if (!alert) return <ResolveAlertNotFound />;
  return <ResolveWorkspace alert={alert} />;
}
