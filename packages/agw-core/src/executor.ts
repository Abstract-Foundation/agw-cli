import { getCommandDefinition } from "./command-registry.js";
import { AgwCliError } from "./errors.js";
import { commandHandlers } from "./execution/handlers/index.js";
import { createToolContext } from "./execution/context.js";
import { applyFieldSelection, formatCommandOutput } from "./execution/output.js";
import { parseFields, parseJsonInput, parseOutputMode } from "./execution/validation.js";
import type { JsonRecord } from "./execution/types.js";
import type { AgwOutputMode } from "./registry/types.js";

export { applyFieldSelection, formatCommandOutput, parseJsonInput, type JsonRecord };

export async function executeCommand(commandId: string, input: JsonRecord): Promise<{ result: unknown; outputMode: AgwOutputMode }> {
  const definition = getCommandDefinition(commandId);
  if (!definition || definition.kind !== "command") {
    throw new AgwCliError("UNKNOWN_COMMAND", `Unknown command: ${commandId}`, 2);
  }

  const handler = commandHandlers[commandId];
  if (!handler) {
    throw new AgwCliError("NOT_IMPLEMENTED", `Command "${commandId}" is registered but not implemented yet.`, 1);
  }

  const context = createToolContext(input);
  const rawResult = await handler(input, context);
  const fields = parseFields(input);
  const outputMode = parseOutputMode(input, definition.output.defaultMode);
  const result = applyFieldSelection(rawResult, fields);

  return { result, outputMode };
}
