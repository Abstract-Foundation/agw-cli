export type * from "./registry/types.js";
export { listResponseSchema, transactionRequestSchema, transactionResponseSchema } from "./registry/helpers.js";

import { appNamespaceDefinition } from "./registry/app.js";
import { authNamespaceDefinition } from "./registry/auth.js";
import { contractNamespaceDefinition } from "./registry/contract.js";
import { mcpNamespaceDefinition } from "./registry/mcp.js";
import { portalNamespaceDefinition } from "./registry/portal.js";
import { schemaCommandDefinition } from "./registry/schema.js";
import { sessionNamespaceDefinition } from "./registry/session.js";
import { txNamespaceDefinition } from "./registry/tx.js";
import { walletNamespaceDefinition } from "./registry/wallet.js";
import type { AgwCommandDefinition, AgwExecutableCommandDefinition } from "./registry/types.js";

export const commandRegistry: AgwCommandDefinition[] = [
  schemaCommandDefinition,
  mcpNamespaceDefinition,
  authNamespaceDefinition,
  sessionNamespaceDefinition,
  walletNamespaceDefinition,
  txNamespaceDefinition,
  contractNamespaceDefinition,
  portalNamespaceDefinition,
  appNamespaceDefinition,
];

export function flattenCommandRegistry(definitions = commandRegistry): AgwCommandDefinition[] {
  return definitions.flatMap(definition => [definition, ...(definition.children ? flattenCommandRegistry(definition.children) : [])]);
}

function isExecutableCommand(definition: AgwCommandDefinition): definition is AgwExecutableCommandDefinition {
  return definition.kind === "command" && Boolean(definition.requestSchema) && Boolean(definition.responseSchema);
}

export function listCommands(): AgwExecutableCommandDefinition[] {
  return flattenCommandRegistry().filter(isExecutableCommand);
}

export function getCommandDefinition(id: string): AgwCommandDefinition | undefined {
  return flattenCommandRegistry().find(definition => definition.id === id);
}

export function findCommandDefinition(id: string): AgwCommandDefinition | undefined {
  return getCommandDefinition(id);
}

export function listCommandDefinitions(): AgwCommandDefinition[] {
  return flattenCommandRegistry();
}
