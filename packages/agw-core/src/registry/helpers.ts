import type {
  AgwAuthRequirement,
  AgwCommandDefinition,
  AgwCommandRisk,
  AgwExposureContract,
  AgwJsonObjectSchema,
  AgwMutationContract,
  AgwOutputContract,
} from "./types.js";

export function defineCommand(definition: AgwCommandDefinition): AgwCommandDefinition {
  return definition;
}

export const emptyObjectSchema = (): AgwJsonObjectSchema => ({
  type: "object",
  properties: {},
});

export const authNone = (): AgwAuthRequirement => ({ kind: "none" });

export const authSession = (readiness: AgwAuthRequirement["readiness"]): AgwAuthRequirement => ({
  kind: "local_session",
  readiness,
});

export const authApproval = (): AgwAuthRequirement => ({
  kind: "companion_web_approval",
});

export const readMutation = (): AgwMutationContract => ({
  risk: "read",
  requiresExplicitExecute: false,
  supportsDryRun: false,
});

export const writeMutation = (risk: AgwCommandRisk = "state_change"): AgwMutationContract => ({
  risk,
  requiresExplicitExecute: true,
  supportsDryRun: true,
});

export const jsonOutput = (supportsFieldSelection: boolean, supportsPagination = false): AgwOutputContract => ({
  defaultMode: "json",
  supportsFieldSelection,
  supportsPagination,
});

export const ndjsonOutput = (supportsFieldSelection: boolean, supportsPagination: boolean): AgwOutputContract => ({
  defaultMode: "ndjson",
  supportsFieldSelection,
  supportsPagination,
});

export const exposure = (cli: boolean, mcp: boolean, skillHints: string[] = []): AgwExposureContract => ({
  cli,
  mcp,
  skillHints,
});

export const transactionRequestSchema: AgwJsonObjectSchema = {
  type: "object",
  properties: {
    to: { type: "string" },
    data: { type: "string" },
    value: { type: "string" },
    execute: { type: "boolean", default: false },
  },
  required: ["to", "data"],
};

export const transactionResponseSchema: AgwJsonObjectSchema = {
  type: "object",
  properties: {
    broadcast: { type: "boolean" },
    preview: { type: "boolean" },
    txHash: { type: "string" },
    requiresExplicitExecute: { type: "boolean" },
    transaction: { type: "object" },
  },
};

export const listResponseSchema: AgwJsonObjectSchema = {
  type: "object",
  properties: {
    items: { type: "array" },
    nextCursor: { type: "string" },
  },
  required: ["items"],
};
