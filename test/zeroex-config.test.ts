import { resolveZeroExConfig } from "../packages/agw-core/src/config/zeroex.js";

describe("0x config resolution", () => {
  it("returns undefined api key by default", () => {
    const config = resolveZeroExConfig({ env: {} });
    expect(config.apiKey).toBeUndefined();
  });

  it("resolves api key from AGW_ZEROEX_API_KEY", () => {
    const config = resolveZeroExConfig({
      env: {
        AGW_ZEROEX_API_KEY: "mcp-key",
      },
    });

    expect(config.apiKey).toBe("mcp-key");
  });

  it("returns undefined when no AGW_ZEROEX_API_KEY is configured", () => {
    const config = resolveZeroExConfig({
      env: {},
    });

    expect(config.apiKey).toBeUndefined();
  });

  it("prefers explicit input apiKey over environment values", () => {
    const config = resolveZeroExConfig({
      apiKey: "cli-key",
      env: {
        AGW_ZEROEX_API_KEY: "env-key",
      },
    });

    expect(config.apiKey).toBe("cli-key");
  });

  it("trims whitespace and ignores empty values", () => {
    const config = resolveZeroExConfig({
      env: {
        AGW_ZEROEX_API_KEY: "  from-env  ",
      },
    });

    expect(config.apiKey).toBe("from-env");
  });
});
