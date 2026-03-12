import { SessionManager } from "../session/manager.js";
import { SessionStorage } from "../session/storage.js";
import type { AgwSessionData } from "../session/types.js";
import type { ToolContext } from "../tools/types.js";
import { Logger } from "../utils/logger.js";
import { parseOptionalNumber, parseOptionalString } from "./validation.js";
import type { JsonRecord } from "./types.js";

export function createToolContext(input: JsonRecord): ToolContext {
  const logger = new Logger("agw");
  const sessionManager = new SessionManager(logger, {
    storageDir: parseOptionalString(input.storageDir, "storageDir"),
    chainId: parseOptionalNumber(input.chainId, "chainId"),
    rpcUrl: parseOptionalString(input.rpcUrl, "rpcUrl"),
    appUrl: parseOptionalString(input.appUrl, "appUrl"),
  });
  sessionManager.initialize();
  return {
    sessionManager,
    logger,
  };
}

export function createSessionStorage(input: JsonRecord): SessionStorage {
  return new SessionStorage(parseOptionalString(input.storageDir, "storageDir"));
}

export function requireActiveSession(context: ToolContext): AgwSessionData {
  const status = context.sessionManager.getSessionStatus();
  if (status !== "active") {
    throw new Error(`session must be active (current status: ${status})`);
  }

  const session = context.sessionManager.getSession();
  if (!session) {
    throw new Error("session is missing");
  }

  return session;
}
