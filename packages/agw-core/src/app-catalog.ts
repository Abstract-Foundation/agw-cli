export interface AgwSkillRef {
  id: string;
  title: string;
  description: string;
  installPath: string;
}

export interface AgwAppContractRef {
  address: string;
  label: string;
}

export interface AgwAppCatalogEntry {
  id: string;
  name: string;
  categories: string[];
  spotlight: boolean;
  verified: boolean;
  description: string;
  docsUrl?: string;
  skillRefs: string[];
  contracts: AgwAppContractRef[];
}

export const skillCatalog: readonly AgwSkillRef[] = [
  {
    id: "agw-auth-session",
    title: "AGW Auth And Session",
    description: "Bootstrap, inspect, and revoke AGW sessions using explicit approval and narrow field selection.",
    installPath: "skills/agw-auth-session",
  },
  {
    id: "agw-wallet-reads",
    title: "AGW Wallet Reads",
    description: "Use wallet and session reads with field trimming and pagination to stay within agent context budgets.",
    installPath: "skills/agw-wallet-reads",
  },
  {
    id: "agw-tx-discipline",
    title: "AGW Transaction Discipline",
    description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
    installPath: "skills/agw-tx-discipline",
  },
  {
    id: "agw-portal-discovery",
    title: "AGW Portal Discovery",
    description: "Find apps, streams, and user profiles through Portal with response shaping for agent-safe reads.",
    installPath: "skills/agw-portal-discovery",
  },
  {
    id: "protocol-aborean",
    title: "Aborean Protocol",
    description: "Compose AGW core commands for Aborean Finance workflows without baking protocol logic into the CLI core.",
    installPath: "skills/protocol-aborean",
  },
];

export const appCatalog: readonly AgwAppCatalogEntry[] = [
  {
    id: "136",
    name: "Gacha",
    categories: ["Games of Chance", "Gaming"],
    spotlight: false,
    verified: true,
    description: "Onchain gacha mechanics and ticket purchase flows.",
    docsUrl: "https://gacha.gitbook.io/gacha",
    skillRefs: ["agw-portal-discovery", "agw-tx-discipline"],
    contracts: [
      { address: "0x3272596F776470D2D7C3f7dfF3dc50888b7D8967", label: "Gacha" },
      { address: "0xe6765C9cb1B42D3CC36Fcd3D2B4fc938db456EaD", label: "Batch purchase" },
    ],
  },
  {
    id: "183",
    name: "Aborean Finance",
    categories: ["DeFi", "Lending"],
    spotlight: true,
    verified: true,
    description: "DeFi borrowing and collateral management flows on Abstract.",
    docsUrl: "https://aborean.finance",
    skillRefs: ["protocol-aborean", "agw-tx-discipline", "agw-wallet-reads"],
    contracts: [
      { address: "0xC0F53703e9f4b79fA2FB09a2aeBA487FA97729c9", label: "Market" },
      { address: "0x4d8971D9932C1c0c16079722b3D93893F16Bb065", label: "Comptroller" },
      { address: "0xF6cDfFf7Ad51caaD860e7A35d6D4075d74039a6B", label: "Reward Distributor" },
    ],
  },
];

export function getSkillRef(skillId: string): AgwSkillRef | undefined {
  return skillCatalog.find(skill => skill.id === skillId);
}

export function listSkillRefs(skillIds: readonly string[]): AgwSkillRef[] {
  return skillIds.map(skillId => getSkillRef(skillId)).filter((skill): skill is AgwSkillRef => Boolean(skill));
}

export function getAppCatalogEntry(appId: string): AgwAppCatalogEntry | undefined {
  return appCatalog.find(app => app.id === appId);
}
