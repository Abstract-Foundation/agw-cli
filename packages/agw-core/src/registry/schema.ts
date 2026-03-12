import { authNone, defineCommand, exposure, jsonOutput, readMutation } from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const schemaCommandDefinition: AgwCommandDefinition = defineCommand({
  id: "schema",
  path: ["schema"],
  kind: "command",
  description: "Print machine-readable command metadata from the shared AGW registry.",
  status: "implemented",
  inputMode: "json",
  auth: authNone(),
  requestSchema: {
    type: "object",
    properties: {
      commandId: { type: "string" },
    },
  },
  responseSchema: {
    type: "object",
    properties: {
      commandCount: { type: "number" },
      commands: { type: "array" },
    },
    required: ["commands"],
  },
  mutation: readMutation(),
  output: jsonOutput(false, false),
  exposure: exposure(true, false),
});
