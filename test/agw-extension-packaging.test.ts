import fs from "node:fs";
import path from "node:path";
import { buildMcpConfigSnippet } from "../packages/agw/src/config/mcp-config.js";

describe("agw extension packaging", () => {
  it("ships Gemini extension descriptors", () => {
    const descriptorPath = path.join(process.cwd(), "packages/agw/extensions/gemini/gemini-extension.json");
    const contextPath = path.join(process.cwd(), "packages/agw/extensions/gemini/GEMINI.md");

    expect(fs.existsSync(descriptorPath)).toBe(true);
    expect(fs.existsSync(contextPath)).toBe(true);

    const descriptor = JSON.parse(fs.readFileSync(descriptorPath, "utf8")) as {
      mcpServers?: Record<string, { command?: string; args?: string[] }>;
    };
    const defaultSnippet = buildMcpConfigSnippet() as {
      mcpServers: Record<string, { command?: string; args?: string[] }>;
    };

    expect(descriptor.mcpServers?.agw?.command).toBe("agw");
    expect(descriptor.mcpServers?.agw?.args).toEqual(["mcp", "serve", "--sanitize", "strict"]);
    expect(descriptor.mcpServers?.agw).toEqual(
      expect.objectContaining(defaultSnippet.mcpServers.agw),
    );
  });

  it("ships Claude Code plugin descriptors", () => {
    const pluginPath = path.join(process.cwd(), "packages/agw/extensions/claude-code/.claude-plugin/plugin.json");
    const mcpPath = path.join(process.cwd(), "packages/agw/extensions/claude-code/.mcp.json");

    expect(fs.existsSync(pluginPath)).toBe(true);
    expect(fs.existsSync(mcpPath)).toBe(true);

    const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, "utf8")) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string>; type?: string }>;
    };

    expect(mcpConfig.mcpServers?.agw?.type).toBe("stdio");
    expect(mcpConfig.mcpServers?.agw?.command).toBe("agw");
    expect(mcpConfig.mcpServers?.agw?.args).toEqual(["mcp", "serve", "--sanitize", "strict"]);
    expect(mcpConfig.mcpServers?.agw?.env).toEqual({ AGW_SANITIZE_PROFILE: "strict" });
  });
});
