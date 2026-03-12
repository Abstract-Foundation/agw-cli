import { authNone, authSession, defineCommand, emptyObjectSchema, exposure, jsonOutput, readMutation } from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const sessionNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "session",
  path: ["session"],
  kind: "namespace",
  description: "Inspect local session state, readiness, and health.",
  status: "planned",
  inputMode: "json",
  auth: authNone(),
  mutation: readMutation(),
  output: jsonOutput(true, false),
  exposure: exposure(true, true),
  children: [
    defineCommand({
      id: "session.status",
      path: ["session", "status"],
      kind: "command",
      description: "Return the current AGW session status and delegated capability summary.",
      status: "implemented",
      inputMode: "json",
      auth: authSession("missing_ok"),
      requestSchema: {
        type: "object",
        properties: {
          storageDir: { type: "string" },
          fields: { type: "array", items: { type: "string" } },
        },
      },
      responseSchema: {
        type: "object",
        properties: {
          status: { type: "string" },
          readiness: { type: "string" },
          policyPreset: { type: "string" },
        },
        required: ["status", "readiness"],
      },
      mutation: readMutation(),
      output: jsonOutput(true, false),
      exposure: exposure(true, true, ["request only the session fields required for the current reasoning step"]),
    }),
    defineCommand({
      id: "session.doctor",
      path: ["session", "doctor"],
      kind: "command",
      description: "Run local health checks for AGW session, config, and companion connectivity.",
      status: "implemented",
      inputMode: "json",
      auth: authSession("missing_ok"),
      requestSchema: emptyObjectSchema(),
      responseSchema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          checks: { type: "array" },
        },
        required: ["ok", "checks"],
      },
      mutation: readMutation(),
      output: jsonOutput(false, false),
      exposure: exposure(true, false),
    }),
  ],
});
