import { getExposedMcpCommands } from "../packages/agw/src/mcp-server.js";

describe("generated agw mcp exposure", () => {
  it("exposes only implemented mcp-backed commands", () => {
    const commands = getExposedMcpCommands(undefined).map((command: { id: string }) => command.id);

    expect(commands).toContain("session.status");
    expect(commands).toContain("wallet.address");
    expect(commands).toContain("wallet.balances");
    expect(commands).toContain("tx.send");
    expect(commands).toContain("contract.write");
    expect(commands).toContain("portal.apps.list");
    expect(commands).not.toContain("app.show");
    expect(commands).not.toContain("mcp.serve");
  });

  it("supports filtering by top-level service group", () => {
    const commands = getExposedMcpCommands(["wallet"]).map((command: { id: string }) => command.id);

    expect(commands).toContain("wallet.address");
    expect(commands).toContain("wallet.balances");
    expect(commands).not.toContain("session.status");
  });
});
