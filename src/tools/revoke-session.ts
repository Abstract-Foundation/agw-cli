import type { ToolHandler } from "./types.js";

export const revokeSessionTool: ToolHandler = {
  name: "revoke_session",
  description:
    "Marks the local AGW session as revoked and deletes the authorization key. " +
    "To fully revoke the signer on-chain, use the companion app.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    context.sessionManager.markSessionRevoked();

    return {
      revoked: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      localStatus: context.sessionManager.getSessionStatus(),
      note: "Local session revoked. Use the companion app to remove the signer from your wallet.",
    };
  },
};
