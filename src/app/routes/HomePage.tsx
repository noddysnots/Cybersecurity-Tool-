import {
  MyActiveTicketsTile,
  PlatformAlertsTile,
  PlatformHealthTile,
  RecentConfigTile,
  TopBlockedAppsTile,
  TrafficTrendTile,
} from "@/components/home/HomeTiles";
import { homeCopy } from "@/content/home";

export function HomePage() {
  return (
    <div className="px-5 py-4" data-testid="home-page">
      <div className="mb-3">
        <h1 className="text-lg font-medium tracking-tight text-text">
          {homeCopy.pageTitle}
        </h1>
        <p className="mt-0.5 text-sm text-text-muted">{homeCopy.pageSubtitle}</p>
      </div>

      <div
        className="grid grid-cols-12 gap-3"
        data-testid="home-grid"
      >
        <MyActiveTicketsTile />
        <PlatformHealthTile />
        <TopBlockedAppsTile />
        <TrafficTrendTile />
        <RecentConfigTile />
        <PlatformAlertsTile />
      </div>
    </div>
  );
}
