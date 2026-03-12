import { getCommandDefinition, listCommands } from "../packages/agw-core/src/index.js";

describe("shared command registry", () => {
  it("defines stable agent-first metadata for commands", () => {
    const commands = listCommands();

    expect(commands.length).toBeGreaterThan(0);
    expect(commands.map(command => command.id)).toContain("session.status");
    expect(commands.every(command => command.requestSchema.type === "object")).toBe(true);
    expect(commands.every(command => command.responseSchema.type === "object")).toBe(true);
  });

  it("marks mutating commands as explicit-execute and dry-run aware", () => {
    const txSend = getCommandDefinition("tx.send");

    expect(txSend).toBeDefined();
    expect(txSend?.status).toBe("implemented");
    expect(txSend?.mutation.risk).toBe("state_change");
    expect(txSend?.mutation.requiresExplicitExecute).toBe(true);
    expect(txSend?.mutation.supportsDryRun).toBe(true);
  });

  it("marks large list surfaces as pagination-aware", () => {
    const portalApps = getCommandDefinition("portal.apps.list");

    expect(portalApps).toBeDefined();
    expect(portalApps?.output.defaultMode).toBe("ndjson");
    expect(portalApps?.output.supportsPagination).toBe(true);
    expect(portalApps?.output.supportsFieldSelection).toBe(true);
  });
});
