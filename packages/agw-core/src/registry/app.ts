import {
  authNone,
  defineCommand,
  exposure,
  fieldsSchema,
  idSchema,
  jsonOutput,
  listResponseSchema,
  ndjsonOutput,
  objectSchema,
  opaqueObjectSchema,
  paginationRequestSchema,
  readMutation,
  sanitize,
  stringSchema,
} from "./helpers.js";
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
      requestSchema: objectSchema({
        ...paginationRequestSchema().properties,
        fields: fieldsSchema(),
      }),
      responseSchema: listResponseSchema(
        objectSchema(
          {
            id: idSchema("Shipped AGW app identifier."),
            name: stringSchema(),
            description: stringSchema(),
            skillRefs: { type: "array", items: opaqueObjectSchema("Shipped skill reference metadata.") },
          },
          { additionalProperties: true },
        ),
      ),
      mutation: readMutation(),
      output: ndjsonOutput(true, true),
      sanitization: sanitize(false),
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
      requestSchema: objectSchema(
        {
          appId: idSchema("Shipped AGW app identifier."),
        },
        { required: ["appId"] },
      ),
      responseSchema: objectSchema(
        {
          app: opaqueObjectSchema("Shipped AGW app metadata."),
          skillRefs: { type: "array", items: opaqueObjectSchema("Shipped skill reference metadata.") },
        },
        { required: ["app", "skillRefs"] },
      ),
      mutation: readMutation(),
      output: jsonOutput(true, false),
      sanitization: sanitize(false),
      exposure: exposure(true, false),
    }),
  ],
});
