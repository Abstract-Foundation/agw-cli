import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { listCommands, type AgwExecutableCommandDefinition } from "./command-registry.js";
import { executeCommand, type JsonRecord } from "./executor.js";

export interface ServeGeneratedMcpOptions {
  services?: string[];
  commandDefaults?: JsonRecord;
}

export function getExposedMcpCommands(services: string[] | undefined): AgwExecutableCommandDefinition[] {
  const serviceSet = services && services.length > 0 ? new Set(services) : null;
  return listCommands().filter(command => {
    if (!command.exposure.mcp || command.status !== "implemented") {
      return false;
    }
    if (!serviceSet) {
      return true;
    }
    return serviceSet.has(command.path[0]);
  });
}

export async function serveGeneratedMcp(options: ServeGeneratedMcpOptions = {}): Promise<void> {
  const commands = getExposedMcpCommands(options.services);
  const commandDefaults = options.commandDefaults ?? {};
  const server = new Server(
    {
      name: "agw",
      version: "0.1.0",
    },
    {
      capabilities: { tools: {} },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: commands.map(command => ({
        name: command.id,
        description: command.description,
        inputSchema: command.requestSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const command = commands.find(entry => entry.id === request.params.name);
    if (!command) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: {
                code: "TOOL_NOT_FOUND",
                message: `Unknown generated MCP tool: ${request.params.name}`,
              },
            }),
          },
        ],
        isError: true,
      };
    }

    try {
      const args = (request.params.arguments ?? {}) as JsonRecord;
      const { result } = await executeCommand(command.id, {
        ...commandDefaults,
        ...args,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: {
                code: "COMMAND_EXECUTION_FAILED",
                message: error instanceof Error ? error.message : String(error),
              },
            }),
          },
        ],
        isError: true,
      };
    }
  });

  await server.connect(new StdioServerTransport());
}
