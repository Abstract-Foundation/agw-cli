#!/usr/bin/env node

import { Command } from "commander";
import {
  AgwCliError,
  commandRegistry,
  findCommandDefinition,
  listCommands,
  toErrorEnvelope,
  type AgwCommandDefinition,
} from "../../agw-core/src/index.js";
import { buildMcpConfigSnippet } from "./config/mcp-config.js";
import { serveGeneratedMcp } from "./mcp-server.js";
import { executeCommand, formatCommandOutput, parseJsonInput } from "./runtime.js";

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function writeError(error: unknown): never {
  const envelope = toErrorEnvelope(error);
  process.stderr.write(`${JSON.stringify(envelope, null, 2)}\n`);

  if (error instanceof AgwCliError) {
    process.exitCode = error.exitCode;
  } else {
    process.exitCode = 1;
  }

  throw error;
}

function registerCommands(parent: Command, definitions: AgwCommandDefinition[]): void {
  for (const definition of definitions) {
    if (definition.id === "schema") {
      continue;
    }

    const segment = definition.path[definition.path.length - 1];
    const command = parent.command(segment).description(definition.description);

    if (definition.children?.length) {
      registerCommands(command, definition.children);
      continue;
    }

    if (definition.id === "mcp.serve") {
      command
        .option("--json <payload>", "Inline JSON payload or @path-to-json-file", "{}")
        .action(async (options: { json: string }) => {
          const input = parseJsonInput(options.json);
          const services =
            Array.isArray(input.services) && input.services.every((entry: unknown) => typeof entry === "string")
              ? input.services
              : undefined;
          const commandDefaults = { ...input };
          delete commandDefaults.services;
          await serveGeneratedMcp({ services, commandDefaults });
        });
      continue;
    }

    command
      .option("--json <payload>", "Inline JSON payload or @path-to-json-file", "{}")
      .option("--output <mode>", "Output mode override: json or ndjson")
      .action(async (options: { json: string; output?: "json" | "ndjson" }) => {
        const input = parseJsonInput(options.json);
        if (options.output) {
          input.output = options.output;
        }
        const { result, outputMode } = await executeCommand(definition.id, input);
        process.stdout.write(formatCommandOutput(result, outputMode));
      });
  }
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("agw")
    .description("Agent-first CLI for Abstract Global Wallet workflows.")
    .version("0.1.0")
    .showHelpAfterError();

  program
    .command("mcp-config")
    .description("Print a ready-to-paste MCP config snippet for the agw binary.")
    .option("--name <name>", "MCP server name override", "agw")
    .option("--npx", "Output npx-based config for the published package")
    .option("--chain-id <chainId>", "Chain id to include in generated args")
    .action((options: { name: string; npx?: boolean; chainId?: string }) => {
      writeJson(
        buildMcpConfigSnippet({
          serverName: options.name,
          npx: options.npx,
          chainId: options.chainId,
        }),
      );
    });

  program
    .command("schema [commandId]")
    .description("Print machine-readable command metadata from the shared AGW registry.")
    .action((commandId?: string) => {
      if (!commandId) {
        writeJson({
          commandCount: listCommands().length,
          commands: listCommands(),
        });
        return;
      }

      const definition = findCommandDefinition(commandId);
      if (!definition) {
        throw new AgwCliError("SCHEMA_NOT_FOUND", `Unknown command schema: ${commandId}`, 2);
      }

      writeJson(definition);
    });

  registerCommands(program, commandRegistry);

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    writeError(error);
  }
}

void main();
