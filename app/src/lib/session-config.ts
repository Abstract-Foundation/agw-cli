import type { SessionPolicyMeta } from './policy-types';

export interface PrivySignerBundle {
  accountAddress: string;
  chainId: number;
  policyMeta?: SessionPolicyMeta;
}
