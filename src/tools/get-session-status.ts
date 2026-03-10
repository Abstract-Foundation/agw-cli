import type { ToolHandler } from "./types.js";

export const getSessionStatusTool: ToolHandler = {
  name: "get_session_status",
  description: "Returns the local AGW session status.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (_params, context) => {
    const session = context.sessionManager.getSession();
    const localStatus = context.sessionManager.getSessionStatus();
    const hasSigner = Boolean(session?.privyWalletId && session?.privyAuthKeyRef);

    return {
      status: localStatus,
      active: localStatus === "active",
      writeReady: localStatus === "active" && hasSigner,
      accountAddress: session?.accountAddress ?? null,
      chainId: session?.chainId ?? context.sessionManager.getChainId(),
      policyPreset: session?.policyMeta?.presetId ?? null,
      enabledTools: session?.policyMeta?.enabledTools ?? null,
    };
  },
};
