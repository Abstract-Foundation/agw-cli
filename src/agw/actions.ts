import { encodeFunctionData, type Abi, type Address, type Hex } from "viem";
import type { PrivyWalletClient } from "../privy/client.js";

export interface AgwSignMessageParameters {
  message: string;
}

export type AgwSignMessageReturnType = `0x${string}`;

export interface AgwSignTransactionParameters {
  account: Address;
  to: Address;
  data: Hex;
  value: bigint;
  chain: null | undefined;
}

export type AgwSignTransactionReturnType = `0x${string}`;

export interface AgwSendTransactionParameters {
  account: Address;
  to: Address;
  data: Hex;
  value: bigint;
  chain: null | undefined;
}

export type AgwSendTransactionReturnType = `0x${string}`;

export interface AgwSendCallsParameters {
  calls: readonly Record<string, unknown>[];
  [key: string]: unknown;
}

export interface AgwSendCallsReturnType {
  id: string;
  capabilities?: Record<string, unknown>;
}

export interface AgwWriteContractParameters {
  account: Address;
  address: Address;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  chain: null | undefined;
}

export type AgwWriteContractReturnType = `0x${string}`;

export interface AgwDeployContractParameters {
  account: Address;
  abi: Abi | readonly unknown[];
  bytecode: Hex;
  chain: null | undefined;
}

export type AgwDeployContractReturnType = `0x${string}`;

export interface AgwActionAdapter {
  signMessage: (args: AgwSignMessageParameters) => Promise<AgwSignMessageReturnType>;
  signTransaction: (args: AgwSignTransactionParameters) => Promise<AgwSignTransactionReturnType>;
  sendTransaction: (args: AgwSendTransactionParameters) => Promise<AgwSendTransactionReturnType>;
  sendCalls: (args: AgwSendCallsParameters) => Promise<AgwSendCallsReturnType>;
  writeContract: (args: AgwWriteContractParameters) => Promise<AgwWriteContractReturnType>;
  deployContract: (args: AgwDeployContractParameters) => Promise<AgwDeployContractReturnType>;
}

function formatValue(value: bigint): string {
  if (value === 0n) {
    return "0x0";
  }
  return `0x${value.toString(16)}`;
}

export function createPrivyActionAdapter(client: PrivyWalletClient, chainId: number): AgwActionAdapter {
  return {
    signMessage: async (args) => {
      const result = await client.signMessage(chainId, args.message);
      return result as AgwSignMessageReturnType;
    },

    signTransaction: async (args) => {
      const result = await client.signTransaction(chainId, {
        to: args.to,
        data: args.data,
        value: formatValue(args.value),
      });
      return result as AgwSignTransactionReturnType;
    },

    sendTransaction: async (args) => {
      const result = await client.sendTransaction(chainId, {
        to: args.to,
        data: args.data,
        value: formatValue(args.value),
      });
      return result as AgwSendTransactionReturnType;
    },

    sendCalls: async (args) => {
      const results: string[] = [];
      for (const call of args.calls) {
        const to = call.to as string | undefined;
        const data = (call.data as string) ?? "0x";
        const value = call.value !== undefined ? BigInt(call.value as string) : 0n;
        const txHash = await client.sendTransaction(chainId, {
          to,
          data,
          value: formatValue(value),
        });
        results.push(txHash);
      }
      return {
        id: results[results.length - 1] ?? "",
        capabilities: {},
      };
    },

    writeContract: async (args) => {
      const data = encodeFunctionData({
        abi: args.abi as Abi,
        functionName: args.functionName,
        args: args.args as readonly unknown[],
      });
      const result = await client.sendTransaction(chainId, {
        to: args.address,
        data,
        value: formatValue(args.value ?? 0n),
      });
      return result as AgwWriteContractReturnType;
    },

    deployContract: async (args) => {
      let data = args.bytecode as string;
      const constructorAbi = (args.abi as Abi).find(
        item => "type" in item && item.type === "constructor",
      );
      if (constructorAbi) {
        try {
          const encodedArgs = encodeFunctionData({
            abi: args.abi as Abi,
            functionName: undefined as never,
            args: [] as readonly unknown[],
          });
          if (encodedArgs && encodedArgs !== "0x") {
            data = (data + encodedArgs.slice(2)) as string;
          }
        } catch {
          // No constructor args.
        }
      }

      const result = await client.sendTransaction(chainId, {
        data,
        value: "0x0",
      });
      return result as AgwDeployContractReturnType;
    },
  };
}
