import type { ToolContext } from "../tools/types.js";

export type JsonRecord = Record<string, unknown>;

export type CommandHandler = (input: JsonRecord, context: ToolContext) => Promise<unknown>;

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === "string");
}
