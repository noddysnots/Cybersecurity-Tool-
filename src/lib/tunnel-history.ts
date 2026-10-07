import type { RemoteNetwork, TunnelState } from "@/types";
import { DEMO_NOW_ISO } from "@/lib/time";

export type TunnelHistoryEvent = {
  id: string;
  at: string;
  state: TunnelState;
  note: string;
};

/**
 * Synthetic tunnel history for the drawer.
 * Pune stays down until Case 2 fix; other sites stay mostly up.
 */
export function tunnelHistoryFor(
  site: RemoteNetwork,
  liveState: TunnelState,
): TunnelHistoryEvent[] {
  const events: TunnelHistoryEvent[] = [
    {
      id: `${site.id}-baseline`,
      at: "2026-09-06T06:35:00.000Z",
      state: "up",
      note: "30 day baseline. Stable IKE and IPsec.",
    },
  ];

  if (site.id === "rn-pune-branch-01") {
    events.push({
      id: `${site.id}-down`,
      at: site.lastStateChange,
      state: "down",
      note: "IKEv2 child SA failed. NO_PROPOSAL_CHOSEN (DH group mismatch).",
    });
    if (liveState === "up") {
      events.push({
        id: `${site.id}-up`,
        at: DEMO_NOW_ISO,
        state: "up",
        note: "IPsec SA re-established after dh-group reverted to group14.",
      });
    }
  } else if (site.tunnelState === "down" || liveState === "down") {
    events.push({
      id: `${site.id}-down`,
      at: site.lastStateChange,
      state: "down",
      note: "Tunnel reported down.",
    });
  } else {
    events.push({
      id: `${site.id}-last`,
      at: site.lastStateChange,
      state: "up",
      note: "Last negotiated SA refresh.",
    });
  }

  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

export type CryptoProfile = {
  label: string;
  ike: { encryption: string; hash: string; dhGroup: string };
  ipsec: { encryption: string; hash: string; dhGroup: string; pfs: string };
};

/** Prisma-side expected profile vs branch drift for Pune. */
export function cryptoProfileFor(
  site: RemoteNetwork,
  liveState: TunnelState,
): CryptoProfile {
  if (site.id === "rn-pune-branch-01" && liveState === "down") {
    return {
      label: "Branch vs Prisma (mismatch)",
      ike: { encryption: "aes-256-cbc", hash: "sha256", dhGroup: "group14" },
      ipsec: {
        encryption: "aes-256-gcm",
        hash: "sha256",
        dhGroup: "group19 (branch)",
        pfs: "yes",
      },
    };
  }
  return {
    label: "IPsec crypto profile",
    ike: { encryption: "aes-256-cbc", hash: "sha256", dhGroup: "group14" },
    ipsec: {
      encryption: "aes-256-gcm",
      hash: "sha256",
      dhGroup: "group14",
      pfs: "yes",
    },
  };
}
