import { Command } from "cmdk";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { addressObjects, securityRules, tickets, users } from "@/data";
import { NAV_ITEMS, shellCopy } from "@/content/shell";
import { useUiPrefs } from "@/lib/ui-prefs";

export function CommandPalette() {
  const open = useUiPrefs((s) => s.paletteOpen);
  const setPaletteOpen = useUiPrefs((s) => s.setPaletteOpen);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(!useUiPrefs.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  const ipItems = useMemo(
    () =>
      addressObjects
        .filter(
          (o) => o.type === "ip-netmask" || o.type === "ip-range" || o.type === "fqdn",
        )
        .slice(0, 40)
        .map((o) => ({
          id: o.id,
          label: o.name,
          value: o.value,
          path: `/objects?q=${encodeURIComponent(o.name)}`,
        })),
    [],
  );

  const go = (path: string) => {
    setPaletteOpen(false);
    navigate(path);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] px-4 pt-[12vh] backdrop-blur-sm"
      data-testid="command-palette-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setPaletteOpen(false);
      }}
    >
      <Command
        label="Command palette"
        className="floating-shadow w-full max-w-xl overflow-hidden rounded-[var(--radius-panel)] border border-border-strong bg-surface-1"
        data-testid="command-palette"
      >
        <Command.Input
          placeholder={shellCopy.searchPlaceholder}
          className="h-12 w-full border-b border-border bg-transparent px-4 text-base text-text outline-none placeholder:text-text-faint"
          data-testid="command-palette-input"
        />
        <Command.List className="max-h-80 overflow-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
            {shellCopy.paletteEmpty}
          </Command.Empty>

          <Command.Group heading={shellCopy.palettePages} className="text-xs text-text-faint">
            {NAV_ITEMS.map((item) => (
              <Command.Item
                key={item.id}
                value={`page ${item.label} ${item.path}`}
                onSelect={() => go(item.path)}
                className="flex cursor-pointer items-center justify-between rounded-[var(--radius-control)] px-3 py-2 text-sm text-text aria-selected:bg-surface-3"
                data-testid={`palette-page-${item.id}`}
              >
                <span>{item.label}</span>
                <span className="font-mono text-xs text-text-faint">{item.path}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading={shellCopy.paletteTickets} className="mt-2 text-xs text-text-faint">
            {tickets.map((ticket) => (
              <Command.Item
                key={ticket.id}
                value={`ticket ${ticket.id} ${ticket.subject}`}
                onSelect={() => go(`/tickets/${ticket.id}`)}
                className="flex cursor-pointer flex-col rounded-[var(--radius-control)] px-3 py-2 text-sm text-text aria-selected:bg-surface-3"
                data-testid={`palette-ticket-${ticket.id}`}
              >
                <span className="font-mono text-accent">{ticket.id}</span>
                <span className="text-text-muted">{ticket.subject}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading={shellCopy.paletteUsers} className="mt-2 text-xs text-text-faint">
            {users.slice(0, 40).map((user) => (
              <Command.Item
                key={user.id}
                value={`user ${user.name} ${user.email}`}
                onSelect={() =>
                  go(`/mobile-users?q=${encodeURIComponent(user.email)}`)
                }
                className="flex cursor-pointer flex-col rounded-[var(--radius-control)] px-3 py-2 text-sm text-text aria-selected:bg-surface-3"
              >
                <span>{user.name}</span>
                <span className="font-mono text-xs text-text-faint">{user.email}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading={shellCopy.paletteIps} className="mt-2 text-xs text-text-faint">
            {ipItems.map((item) => (
              <Command.Item
                key={item.id}
                value={`ip ${item.label} ${item.value}`}
                onSelect={() => go(item.path)}
                className="flex cursor-pointer flex-col rounded-[var(--radius-control)] px-3 py-2 text-sm text-text aria-selected:bg-surface-3"
              >
                <span className="font-mono">{item.value}</span>
                <span className="text-xs text-text-muted">{item.label}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading={shellCopy.paletteRules} className="mt-2 text-xs text-text-faint">
            {securityRules.map((rule) => (
              <Command.Item
                key={rule.id}
                value={`rule ${rule.name} ${rule.container}`}
                onSelect={() =>
                  go(`/policies?q=${encodeURIComponent(rule.name)}`)
                }
                className="flex cursor-pointer flex-col rounded-[var(--radius-control)] px-3 py-2 text-sm text-text aria-selected:bg-surface-3"
              >
                <span className="font-mono">{rule.name}</span>
                <span className="text-xs text-text-muted">
                  {rule.container}, pos {rule.position}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
