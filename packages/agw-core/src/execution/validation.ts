import fs from "node:fs";
import { isAddress } from "viem";
import { AgwCliError } from "../errors.js";
import type { AgwOutputMode } from "../registry/types.js";
import type { JsonRecord } from "./types.js";

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(entry => typeof entry === "string");
}

export function rejectDisallowedControlCharacters(value: string, field: string): void {
  for (const char of value) {
    const code = char.charCodeAt(0);
    const allowedWhitespace = code === 9 || code === 10 || code === 13;
    if (code < 32 && !allowedWhitespace) {
      throw new AgwCliError("INVALID_INPUT", `${field} contains disallowed control characters`, 2);
    }
  }
}

function rejectControlCharactersInValue(value: unknown, field: string): void {
  if (typeof value === "string") {
    rejectDisallowedControlCharacters(value, field);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectControlCharactersInValue(entry, `${field}[${index}]`));
    return;
  }

  if (!isJsonRecord(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    rejectControlCharactersInValue(entry, `${field}.${key}`);
  }
}

function assertNoEmbeddedQueryFragments(value: string, field: string): void {
  if (value.includes("?") || value.includes("#")) {
    throw new AgwCliError("INVALID_INPUT", `${field} must not include query or fragment characters`, 2);
  }
}

function assertNoEncodedTraversal(value: string, field: string): void {
  if (/%2e|%2f|%5c/i.test(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must not contain encoded traversal or slash characters`, 2);
  }
}

export function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a non-empty string when provided`, 2);
  }
  rejectDisallowedControlCharacters(value, field);

  if (field.endsWith("Id") || field === "address" || field === "appId") {
    assertNoEmbeddedQueryFragments(value, field);
    assertNoEncodedTraversal(value, field);
  }

  return value.trim();
}

export function parseOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a finite number when provided`, 2);
  }
  return value;
}

export function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a boolean when provided`, 2);
  }
  return value;
}

export function assertDecimalString(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a non-negative integer string`, 2);
  }
  return value;
}

export function assertHexString(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value) || value.length % 2 !== 0) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a 0x-prefixed hex string with even length`, 2);
  }
  return value;
}

export function assertAddressString(value: unknown, field: string): string {
  if (typeof value !== "string" || !isAddress(value)) {
    throw new AgwCliError("INVALID_INPUT", `${field} must be a valid 0x-prefixed address`, 2);
  }
  return value;
}

export function parseJsonInput(raw: string): JsonRecord {
  const source = raw.trim() === "" ? "{}" : raw;
  const payload = source.startsWith("@") ? fs.readFileSync(source.slice(1), "utf8") : source;
  rejectDisallowedControlCharacters(payload, "json");

  const parsed = JSON.parse(payload) as unknown;
  if (!isJsonRecord(parsed)) {
    throw new AgwCliError("INVALID_INPUT", "json input must deserialize to an object", 2);
  }
  rejectControlCharactersInValue(parsed, "json");
  return parsed;
}

export function parseFields(input: JsonRecord): string[] | undefined {
  if (input.fields === undefined) {
    return undefined;
  }
  if (!isStringArray(input.fields)) {
    throw new AgwCliError("INVALID_INPUT", "fields must be an array of strings", 2);
  }
  input.fields.forEach((field, index) => {
    rejectDisallowedControlCharacters(field, `fields[${index}]`);
    assertNoEmbeddedQueryFragments(field, `fields[${index}]`);
  });
  return input.fields;
}

export function parseOutputMode(input: JsonRecord, defaultMode: AgwOutputMode): AgwOutputMode {
  if (input.output === undefined) {
    return defaultMode;
  }
  if (input.output !== "json" && input.output !== "ndjson") {
    throw new AgwCliError("INVALID_INPUT", 'output must be either "json" or "ndjson"', 2);
  }
  return input.output;
}
