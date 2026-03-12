import { appCatalog, getAppCatalogEntry, listSkillRefs } from "../../app-catalog.js";
import { portalGetAppTool } from "../../tools/portal-get-app.js";
import { portalGetUserProfileTool } from "../../tools/portal-get-user-profile.js";
import { portalListAppsTool } from "../../tools/portal-list-apps.js";
import { portalListStreamsTool } from "../../tools/portal-list-streams.js";
import type { ToolContext } from "../../tools/types.js";
import { AgwCliError } from "../../errors.js";
import { sliceItemsWithCursor } from "../output.js";
import type { CommandHandler } from "../types.js";
import { parseOptionalNumber, parseOptionalString } from "../validation.js";

export const portalAppHandlers: Record<string, CommandHandler> = {
  "portal.apps.list": async input => portalListAppsTool.handler({ page: input.page, limit: input.pageSize }, {} as ToolContext),
  "portal.apps.get": async input =>
    portalGetAppTool.handler(
      {
        id: parseOptionalNumber(input.appId, "appId"),
        includeContracts: input.includeContracts === true,
      },
      {} as ToolContext,
    ),
  "portal.streams.list": async input =>
    portalListStreamsTool.handler(
      {
        app: input.appId,
        page: input.page,
        limit: input.pageSize,
        sortBy: input.sortBy,
        language: input.language,
      },
      {} as ToolContext,
    ),
  "portal.user-profile.get": async (input, context) =>
    portalGetUserProfileTool.handler({ address: parseOptionalString(input.address, "address") }, context),
  "app.list": async input => {
    const { items, nextCursor } = sliceItemsWithCursor([...appCatalog], input.cursor, input.pageSize);
    return {
      items: items.map(app => ({
        ...app,
        skillRefs: listSkillRefs(app.skillRefs),
      })),
      nextCursor,
      totalItems: appCatalog.length,
    };
  },
  "app.show": async input => {
    const appId = parseOptionalString(input.appId, "appId");
    if (!appId) {
      throw new AgwCliError("INVALID_INPUT", "appId is required", 2);
    }

    const app = getAppCatalogEntry(appId);
    if (!app) {
      throw new AgwCliError("APP_NOT_FOUND", `app ${appId} is not in the shipped AGW app catalog`, 2);
    }

    return {
      app,
      skillRefs: listSkillRefs(app.skillRefs),
    };
  },
};
