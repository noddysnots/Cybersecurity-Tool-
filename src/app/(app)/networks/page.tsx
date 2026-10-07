import { PlaceholderPage } from "@/components/shell/PlaceholderPage";
import { PLACEHOLDERS } from "@/content/shell";

export default function Page() {
  return (
    <div className="h-full overflow-auto p-6">
      <PlaceholderPage {...PLACEHOLDERS.networks} />
    </div>
  );
}
