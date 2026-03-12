import { authNone, defineCommand, exposure, jsonOutput, listResponseSchema, ndjsonOutput, readMutation } from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const appNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "app",
  path: ["app"],
  kind: "namespace",
  description: "Discover supported AGW apps and their associated skills or workflow guidance.",
  status: "planned",
  inputMode: "json",
  auth: authNone(),
  mutation: readMutation(),
  output: ndjsonOutput(true, true),
  exposure: exposure(true, false),
  children: [
    defineCommand({
      id: "app.list",
      path: ["app", "list"],
      kind: "command",
      description: "List AGW app records and skill metadata.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: {
        type: "object",
        properties: {
          cursor: { type: "string" },
          pageSize: { type: "number" },
          fields: { type: "array", items: { type: "string" } },
        },
      },
      responseSchema: listResponseSchema,
      mutation: readMutation(),
      output: ndjsonOutput(true, true),
      exposure: exposure(true, false),
    }),
    defineCommand({
      id: "app.show",
      path: ["app", "show"],
      kind: "command",
      description: "Show AGW app metadata and related skill references.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: {
        type: "object",
        properties: {
          appId: { type: "string" },
        },
        required: ["appId"],
      },
      responseSchema: {
        type: "object",
        properties: {
          app: { type: "object" },
          skillRefs: { type: "array" },
        },
        required: ["app", "skillRefs"],
      },
      mutation: readMutation(),
      output: jsonOutput(true, false),
      exposure: exposure(true, false),
    }),
  ],
});
