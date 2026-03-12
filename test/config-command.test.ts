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
});
