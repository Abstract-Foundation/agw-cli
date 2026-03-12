import { authNone, defineCommand, exposure, jsonOutput, readMutation } from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const mcpNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "mcp",
  path: ["mcp"],
  kind: "namespace",
  description: "Generated MCP surface projected from the shared command registry.",
  status: "planned",
  inputMode: "json",
  auth: authNone(),
  mutation: readMutation(),
  output: jsonOutput(false, false),
  exposure: exposure(true, false),
  children: [
    defineCommand({
      id: "mcp.serve",
      path: ["mcp", "serve"],
      kind: "command",
      description: "Run the stdio MCP server generated from the shared AGW registry.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: {
        type: "object",
        properties: {
          services: { type: "array", items: { type: "string" } },
        },
      },
      responseSchema: {
        type: "object",
        properties: {
          transport: { type: "string" },
          services: { type: "array" },
        },
        required: ["transport", "services"],
      },
      mutation: readMutation(),
      output: jsonOutput(false, false),
      exposure: exposure(true, false),
    }),
  ],
});
