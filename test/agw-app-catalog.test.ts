import fs from "node:fs";
import path from "node:path";
import { executeCommand } from "../packages/agw/src/runtime.js";

describe("agw app catalog and shipped skills", () => {
  it("lists curated app records with shipped skill references", async () => {
    await expect(
      executeCommand("app.list", {
        pageSize: 2,
        fields: ["items.id", "items.name", "items.skillRefs", "nextCursor"],
      }),
    ).resolves.toEqual({
      outputMode: "ndjson",
      result: {
        items: [
          {
            id: "12",
            name: "MYRIAD",
            skillRefs: [
              {
                id: "agw-portal-discovery",
                title: "AGW Portal Discovery",
                description: "Find apps, streams, and user profiles through Portal with response shaping for agent-safe reads.",
                installPath: "skills/agw-portal-discovery",
              },
              {
                id: "agw-tx-discipline",
                title: "AGW Transaction Discipline",
                description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
                installPath: "skills/agw-tx-discipline",
              },
            ],
          },
          {
            id: "136",
            name: "Gacha",
            skillRefs: [
              {
                id: "agw-portal-discovery",
                title: "AGW Portal Discovery",
                description: "Find apps, streams, and user profiles through Portal with response shaping for agent-safe reads.",
                installPath: "skills/agw-portal-discovery",
              },
              {
                id: "agw-tx-discipline",
                title: "AGW Transaction Discipline",
                description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
                installPath: "skills/agw-tx-discipline",
              },
            ],
          },
        ],
        nextCursor: "2",
      },
    });
  });

  it("returns detailed app metadata for shipped protocol exemplars", async () => {
    await expect(
      executeCommand("app.show", {
        appId: "183",
      }),
    ).resolves.toEqual({
      outputMode: "json",
      result: {
        app: {
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
        skillRefs: [
          {
            id: "protocol-aborean",
            title: "Aborean Protocol",
            description: "Compose AGW core commands for Aborean Finance workflows without baking protocol logic into the CLI core.",
            installPath: "skills/protocol-aborean",
          },
          {
            id: "agw-tx-discipline",
            title: "AGW Transaction Discipline",
            description: "Preview-first rules for signing, sends, transfers, contract writes, and deployments.",
            installPath: "skills/agw-tx-discipline",
          },
          {
            id: "agw-wallet-reads",
            title: "AGW Wallet Reads",
            description: "Use wallet and session reads with field trimming and pagination to stay within agent context budgets.",
            installPath: "skills/agw-wallet-reads",
          },
        ],
      },
    });
  });

  it("ships the first-party skill files with the agw package", () => {
    const skillFiles = [
      "packages/agw/skills/agw-auth-session/SKILL.md",
      "packages/agw/skills/agw-wallet-reads/SKILL.md",
      "packages/agw/skills/agw-tx-discipline/SKILL.md",
      "packages/agw/skills/agw-portal-discovery/SKILL.md",
      "packages/agw/skills/protocol-aborean/SKILL.md",
    ];

    for (const skillFile of skillFiles) {
      expect(fs.existsSync(path.join(process.cwd(), skillFile))).toBe(true);
    }
  });
});
