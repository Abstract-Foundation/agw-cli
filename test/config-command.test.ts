import { buildMcpConfigSnippet } from "../packages/agw/src/config/mcp-config.js";

describe("config helper command", () => {
  it("builds a valid MCP config snippet", () => {
    const snippet = buildMcpConfigSnippet({
      command: "node",
      args: ["/tmp/agw/dist/index.js", "mcp", "serve"],
      serverName: "agw-local",
    });

    expect(snippet).toEqual({
      mcpServers: {
        "agw-local": {
          command: "node",
          args: ["/tmp/agw/dist/index.js", "mcp", "serve"],
        },
      },
    });
  });

  it("builds a strict-sanitize default snippet for the published package", () => {
    const snippet = buildMcpConfigSnippet({
      npx: true,
      serverName: "agw",
      chainId: "2741",
    });

    expect(snippet).toEqual({
      mcpServers: {
        agw: {
          command: "npx",
          args: ["-y", "@abstract-foundation/agw", "mcp", "serve", "--sanitize", "strict", "--chain-id", "2741"],
          env: {
            AGW_SANITIZE_PROFILE: "strict",
          },
        },
      },
    });
  });
});
