export interface BuildMcpConfigSnippetInput {
  command?: string;
  args?: string[];
  serverName?: string;
  npx?: boolean;
  chainId?: string;
}

export function buildMcpConfigSnippet(input: BuildMcpConfigSnippetInput = {}): Record<string, unknown> {
  const serverName = input.serverName ?? "agw";

  if (input.npx) {
    const args = ["-y", "@abstract-foundation/agw", "mcp", "serve"];
    if (input.chainId) {
      args.push("--json", JSON.stringify({ chainId: Number(input.chainId) }));
    }
    return {
      mcpServers: {
        [serverName]: {
          command: "npx",
          args,
        },
      },
    };
  }

  const command = input.command ?? "agw";
  const args = input.args ?? ["mcp", "serve"];

  return {
    mcpServers: {
      [serverName]: {
        command,
        args,
      },
    },
  };
}
