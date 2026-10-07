import alertsData from "@/data/alerts.json";
import { AlertNotFound, InvestigateWorkspace } from "@/components/investigate";
import type { Alert } from "@/types";

const alerts = alertsData as Alert[];

export function generateStaticParams() {
  return alerts.map((alert) => ({ alertId: alert.id }));
}

export default async function Page({
  params,
}: PageProps<"/investigate/[alertId]">) {
  const { alertId } = await params;
  const alert = alerts.find((item) => item.id === alertId);
  if (!alert) return <AlertNotFound />;
  return <InvestigateWorkspace alert={alert} />;
}
