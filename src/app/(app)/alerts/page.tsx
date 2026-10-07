import { Suspense } from "react";
import { AlertsFallback, AlertsQueue } from "@/components/alerts";

export default function Page() {
  return (
    <div className="h-full overflow-auto p-6">
      <Suspense fallback={<AlertsFallback />}>
        <AlertsQueue />
      </Suspense>
    </div>
  );
}
