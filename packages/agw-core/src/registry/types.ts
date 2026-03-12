export type AgwCommandStatus = "implemented" | "planned";
export type AgwCommandKind = "namespace" | "command";
export type AgwAuthMode = "none" | "local_session" | "companion_web_approval";
export type AgwCommandRisk = "read" | "state_change" | "destructive";
export type AgwOutputMode = "json" | "ndjson";

export interface AgwJsonObjectSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
}

export interface AgwAuthRequirement {
  kind: AgwAuthMode;
  readiness?: "missing_ok" | "active_required" | "write_ready_required";
}

export interface AgwMutationContract {
  risk: AgwCommandRisk;
  requiresExplicitExecute: boolean;
  supportsDryRun: boolean;
}

export interface AgwOutputContract {
  defaultMode: AgwOutputMode;
  supportsFieldSelection: boolean;
  supportsPagination: boolean;
}

export interface AgwExposureContract {
  cli: boolean;
  mcp: boolean;
  skillHints: string[];
}

export interface AgwCommandDefinition {
  id: string;
  path: string[];
  kind: AgwCommandKind;
  description: string;
  status: AgwCommandStatus;
  inputMode: "json";
  auth: AgwAuthRequirement;
  requestSchema?: AgwJsonObjectSchema;
  responseSchema?: AgwJsonObjectSchema;
  mutation: AgwMutationContract;
  output: AgwOutputContract;
  exposure: AgwExposureContract;
  children?: AgwCommandDefinition[];
}

export interface AgwExecutableCommandDefinition extends AgwCommandDefinition {
  kind: "command";
  requestSchema: AgwJsonObjectSchema;
  responseSchema: AgwJsonObjectSchema;
}
