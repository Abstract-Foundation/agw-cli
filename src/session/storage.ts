import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isSessionPolicyMeta } from "../policy/meta.js";
import { authKeyfileExists, deleteAuthKeyfile } from "../privy/auth.js";
import type { AgwSessionData } from "./types.js";

export class SessionStorage {
  private readonly dir: string;
  private readonly filePath: string;

  constructor(dir?: string) {
    this.dir = dir ?? path.join(os.homedir(), ".agw-mcp");
    this.filePath = path.join(this.dir, "session.json");
  }

  get path(): string {
    return this.filePath;
  }

  get storageDir(): string {
    return this.dir;
  }

  private ensureDir(): void {
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    try {
      fs.chmodSync(this.dir, 0o700);
    } catch {
      // Ignore chmod errors on platforms that do not support unix permissions.
    }
  }

  private resolveAuthKeyRefForRuntime(data: AgwSessionData): AgwSessionData | null {
    if (!data.privyAuthKeyRef) {
      return data;
    }

    const keyfilePath = data.privyAuthKeyRef.value;

    if (!fs.existsSync(keyfilePath)) {
      if (data.status === "revoked") {
        return data;
      }
      return null;
    }

    return data;
  }

  load(): AgwSessionData | null {
    try {
      if (!fs.existsSync(this.filePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<AgwSessionData>;
      if (
        typeof parsed.accountAddress !== "string" ||
        typeof parsed.chainId !== "number" ||
        typeof parsed.createdAt !== "number" ||
        typeof parsed.updatedAt !== "number" ||
        typeof parsed.status !== "string" ||
        (parsed.privyWalletId !== undefined && typeof parsed.privyWalletId !== "string") ||
        (parsed.privyAuthKeyRef !== undefined && parsed.privyAuthKeyRef?.kind !== "keyfile") ||
        (parsed.privyAuthKeyRef !== undefined && typeof parsed.privyAuthKeyRef?.value !== "string") ||
        (parsed.policyMeta !== undefined && !isSessionPolicyMeta(parsed.policyMeta))
      ) {
        return null;
      }
      return this.resolveAuthKeyRefForRuntime(parsed as AgwSessionData);
    } catch {
      return null;
    }
  }

  save(data: AgwSessionData): void {
    this.ensureDir();
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  deleteAuthKeyfile(): void {
    if (!authKeyfileExists(this.dir)) {
      return;
    }
    deleteAuthKeyfile(this.dir);
  }

  delete(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {
      // Ignore file deletion errors.
    }
    this.deleteAuthKeyfile();
  }
}
