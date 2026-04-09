---
name: playing-lingo
description: Play the Lingo word guessing game on Abstract chain — practice mode, ETH duel betting, stickers, achievements, referrals, and jackpots via MCP tools. Use when a user wants to play Lingo, start a practice game, create or join a duel, guess a word, check match status, deposit or withdraw ETH for duels, view stats or leaderboard, collect stickers, claim achievements, do daily check-in, use referral codes, or check the jackpot. Trigger for requests mentioning Lingo, Wordle duel, word game, practice game, duel bet, guess word, match status, ETH deposit for game, withdraw winnings, player stats, leaderboard, stickers, achievements, check-in, referral, or jackpot.
---

# Playing Lingo

Lingo is a competitive Wordle-style word guessing game on the Abstract blockchain. Players guess 5-letter words,
receive per-tile feedback (green/yellow/gray), and compete in practice mode (free, vs bot) or ETH-betting duels (1v1
PvP). The game features a jackpot system, LP-based ranking, achievements, stickers, daily check-ins, and referrals.

## Operating Rules

- **Authentication required.** Most MCP tools require a Bearer token. Generate one at
  [https://witty.game/lingo/mcp-token](https://witty.game/lingo/mcp-token) using the same wallet your agent uses, then
  add the MCP server to your client.
- **Start guessing immediately.** After creating a duel, submit guesses right away — even if the match status is
  "waiting" (no opponent yet). Do NOT wait for an opponent to join.
- **Deposit before dueling.** You must complete an on-chain `depositETH` transaction to the SignedVault contract BEFORE
  calling `lingo_duel_create`. Read [references/signed-vault-contract.md](./references/signed-vault-contract.md) for
  the full deposit flow.
- **Withdraw after winning.** When you win a duel, the match result contains a `withdrawal_signature`. Use it to call
  `withdrawETH` on-chain to claim your ETH. Jackpot wins require a separate withdrawal.
- **Preview on-chain transactions.** Always use `--dry-run` before `--execute` for any contract interaction.
- Read [references/mcp-tools.md](./references/mcp-tools.md) for the complete tool reference.
- Read [references/game-rules.md](./references/game-rules.md) for detailed game rules, tiers, and economy.

## MCP Setup

### 0. Set up your agent wallet

Your agent needs access to a wallet on Abstract chain to deposit ETH and play duels. If you don't have one yet, the
[AGW CLI](https://github.com/Abstract-Foundation/agw-cli) is one easy way to set up a wallet your agent uses.

### 1. Generate a token

Visit [https://witty.game/lingo/mcp-token](https://witty.game/lingo/mcp-token) and generate an MCP access token.

**Important:** You must log in with the **same wallet your agent uses** (the AGW wallet). If the token is generated from
a different wallet, deposits, withdrawals, and duel operations will fail because the on-chain wallet won't match the
authenticated player account.

### 2. Add the MCP server

**Claude Code (CLI / Desktop):**

```bash
claude mcp add --transport http --scope user lingo https://api.lingo.witty.game/mcp --header "Authorization: Bearer <YOUR_TOKEN>"
```

**Claude Desktop (manual config — `claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "lingo": {
      "url": "https://api.lingo.witty.game/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_TOKEN>"
      }
    }
  }
}
```

**Cursor / other MCP clients:**

| Property | Value                                         |
|----------|-----------------------------------------------|
| URL      | `https://api.lingo.witty.game/mcp`            |
| Method   | `POST`                                        |
| Header   | `Authorization: Bearer <YOUR_TOKEN>`          |

Replace `<YOUR_TOKEN>` with the token from step 1.

## MCP Server

| Property | Value                                         |
|----------|-----------------------------------------------|
| Endpoint | `https://api.lingo.witty.game/mcp`            |
| Protocol | MCP (Model Context Protocol)                  |
| Auth     | `Authorization: Bearer <accessToken>`         |

The MCP server exposes tools (actions) and resources (read-only data):

**Resources** (read via MCP `resources/read`):
- `lingo://rules/game` — game rules, mechanics, winner determination
- `lingo://rules/tiers` — betting tier configuration and fee breakdown
- `lingo://rules/ranks` — LP rank thresholds (Bronze/Silver/Gold)
- `lingo://contracts/chain-info` — Abstract chain ID, RPC, explorer
- `lingo://contracts/signed-vault` — SignedVault contract address, resolver, full ABI
- `lingo://contracts/deposit-guide` — step-by-step ETH deposit instructions
- `lingo://contracts/withdraw-guide` — step-by-step ETH withdrawal instructions
- `lingo://contracts/subgraph` — subgraph URL, schema, example GraphQL queries

## Betting Tiers

| Tier    | Bet       | Winner Gets | Gem Reward |
|---------|-----------|-------------|------------|
| casual  | 0.001 ETH | 0.0019 ETH  | 10 gems    |
| shrimp  | 0.01 ETH  | 0.019 ETH   | 50 gems    |
| whale   | 0.1 ETH   | 0.19 ETH    | 250 gems   |

Fee: 5% total (2.5% jackpot + 2.5% protocol). Both players earn gems regardless of outcome.

## Contract

| Property           | Value                                        |
|--------------------|----------------------------------------------|
| SignedVault        | `0xF5005cCA582Cb510D15d4D025F78C9258ec07F4b` |
| Network            | Abstract Mainnet (chain ID 2741)             |
| Resolver Address   | `0xde27F91F4A1CA98AfD519315432424b7d0346e3C` |
| ETH Token Address  | `0x0000000000000000000000000000000000000000` (native ETH sentinel) |
| Subgraph URL       | `https://api.goldsky.com/api/public/project_cmgz8pxdm000i5ep21i0oazas/subgraphs/signed-vault-subgraph-abstract/latest/gn` |
| Lingo App ID       | `223` (for Abstract Portal voting)           |

These addresses and the full ABI are also available at runtime via the MCP resource `lingo://contracts/signed-vault`.
The subgraph URL and example queries are available via `lingo://contracts/subgraph`.

## ABI Format

The AGW CLI requires full JSON ABI objects, not human-readable strings. Every `abi` array element must be an object with
`type`, `name`, `inputs`, `outputs`, and `stateMutability` fields.

## Task Map

### Play a practice game (free)

```
1. Call lingo_practice_start → returns session_id and word length
2. Call lingo_practice_guess with session_id and a 5-letter word
3. Read the feedback: green (right letter, right spot), yellow (right letter, wrong spot), gray (not in word)
4. Repeat guesses (up to 6 total) using feedback to narrow down the answer
5. The bot solves on turn 4 — try to solve in 3 or fewer turns to win
```

### Play a duel (ETH betting)

```
1. Choose a tier: casual (0.001 ETH), shrimp (0.01 ETH), whale (0.1 ETH)
2. Deposit ETH on-chain:
   - Pick a random unused nonce (e.g., current unix timestamp)
   - Call SignedVault.depositETH(resolver, nonce) with value = tier bet amount
   - Wait for confirmation
3. Call lingo_duel_create with tier and deposit_nonce
   - For private rooms: set is_private=true (returns invite_code)
   - To join a private room: pass invite_code
4. Start guessing immediately with lingo_duel_guess — do NOT wait for an opponent
5. Use tile feedback to solve the word in as few turns as possible
6. When the match completes, call lingo_duel_status to get the result
7. If you won:
   - Call SignedVault.withdrawETH using withdrawal_signature from the match result
   - If you solved on turn 1 (jackpot!), make a separate withdrawETH call with the jackpot fields
```

### Check match status

```
Call lingo_duel_status with match_id
- Opponent guesses are hidden until you finish your turns
- Answer words are hidden until the match completes
- Winner gets withdrawal_signature, withdrawal_nonce, withdrawal_deadline in the response
```

### Scan history and auto-withdraw unclaimed winnings

When browsing duel history (`lingo_duel_history`), proactively check for completed matches where the player won
but hasn't withdrawn on-chain yet. Withdraw any unclaimed winnings on the spot.

```
1. Call lingo_duel_history (paginate through all pages if needed)
2. For each match where is_winner == true and withdrawal_signature exists:
   a. Extract the nonce from withdrawal_signature.nonce
   b. Call SignedVault.usedNonces(resolver, nonce) on-chain to check if already withdrawn:
      agw contract write --json '{
        "address": "0xF5005cCA582Cb510D15d4D025F78C9258ec07F4b",
        "abi": [{"type":"function","name":"usedNonces","stateMutability":"view","inputs":[{"name":"resolver","type":"address"},{"name":"nonce","type":"uint256"}],"outputs":[{"name":"used","type":"bool"}]}],
        "functionName": "usedNonces",
        "args": ["0xde27F91F4A1CA98AfD519315432424b7d0346e3C", "<NONCE>"]
      }' --dry-run
   c. If usedNonces returns false → the withdrawal is unclaimed. Execute withdrawETH:
      agw contract write --json '{
        "address": "0xF5005cCA582Cb510D15d4D025F78C9258ec07F4b",
        "abi": [{"type":"function","name":"withdrawETH","stateMutability":"nonpayable","inputs":[{"name":"user","type":"address"},{"name":"amount","type":"uint256"},{"name":"resolver","type":"address"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"},{"name":"signature","type":"bytes"}],"outputs":[]}],
        "functionName": "withdrawETH",
        "args": ["<USER>", "<AMOUNT>", "0xde27F91F4A1CA98AfD519315432424b7d0346e3C", "<NONCE>", "<DEADLINE>", "<SIGNATURE>"]
      }' --dry-run
      All values come directly from the withdrawal_signature object in the match result.
   d. Same check for jackpot_withdrawal_signature if jackpot_amount is present.
3. Report which matches were already claimed and which were newly withdrawn.
```

**Tip:** This is useful as a periodic sweep — winnings don't expire (deadline is ~100 years), so unclaimed
withdrawals stay valid indefinitely, but it's better to claim them sooner.

### Join a waiting public match

```
1. Call lingo_duel_waiting with the tier to see available matches
2. Deposit ETH on-chain for the chosen tier
3. Call lingo_duel_create with the tier — matchmaking pairs you with a waiting opponent
```

### Deposit ETH on-chain (before dueling)

```bash
agw contract write --json '{
  "address": "0xF5005cCA582Cb510D15d4D025F78C9258ec07F4b",
  "abi": [{"type":"function","name":"depositETH","stateMutability":"payable","inputs":[{"name":"resolver","type":"address"},{"name":"nonce","type":"uint256"}],"outputs":[]}],
  "functionName": "depositETH",
  "args": ["0xde27F91F4A1CA98AfD519315432424b7d0346e3C", "<NONCE>"],
  "value": "<BET_AMOUNT_WEI>"
}' --dry-run
```

Replace:
- `<NONCE>` — a random unused uint256 (e.g., current unix timestamp)
- `<BET_AMOUNT_WEI>` — casual: `1000000000000000`, shrimp: `10000000000000000`, whale: `100000000000000000`

Execute after confirming the preview: replace `--dry-run` with `--execute`.

### Withdraw ETH winnings (after winning a duel)

```bash
agw contract write --json '{
  "address": "0xF5005cCA582Cb510D15d4D025F78C9258ec07F4b",
  "abi": [{"type":"function","name":"withdrawETH","stateMutability":"nonpayable","inputs":[{"name":"user","type":"address"},{"name":"amount","type":"uint256"},{"name":"resolver","type":"address"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"},{"name":"signature","type":"bytes"}],"outputs":[]}],
  "functionName": "withdrawETH",
  "args": ["<YOUR_ADDRESS>", "<WINNER_REWARD_WEI>", "0xde27F91F4A1CA98AfD519315432424b7d0346e3C", "<WITHDRAWAL_NONCE>", "<WITHDRAWAL_DEADLINE>", "<WITHDRAWAL_SIGNATURE>"]
}' --dry-run
```

All values (`withdrawal_nonce`, `withdrawal_deadline`, `withdrawal_signature`, reward amount) come from the
`lingo_duel_status` response after winning.

### Verify a deposit on-chain

```bash
agw contract write --json '{
  "address": "0xF5005cCA582Cb510D15d4D025F78C9258ec07F4b",
  "abi": [{"type":"function","name":"getDeposit","stateMutability":"view","inputs":[{"name":"user","type":"address"},{"name":"token","type":"address"},{"name":"resolver","type":"address"},{"name":"nonce","type":"uint256"}],"outputs":[{"name":"amount","type":"uint256"}]}],
  "functionName": "getDeposit",
  "args": ["<YOUR_ADDRESS>", "0x0000000000000000000000000000000000000000", "0xde27F91F4A1CA98AfD519315432424b7d0346e3C", "<NONCE>"]
}' --dry-run
```

Use `0x0000000000000000000000000000000000000000` as the token address for ETH deposits.

### Daily check-in

```
Call lingo_checkin with today's date (YYYY-MM-DD format)
Streak bonus: 1d=10, 2d=20, 3d=30, 4d=40, 5d+=50 gems. Missing a day resets streak.
```

### View stats and leaderboard

```
- lingo_player_stats — your full stats (wins, losses, ETH, LP, rank, gems, streaks)
- lingo_player_profile — your or another player's profile with recent matches
- lingo_leaderboard — LP rankings (no auth required)
```

### Collect and manage stickers

```
- lingo_purchase_sticker_pack — buy a random sticker for 200 gems
- lingo_my_stickers — view owned stickers
- lingo_upgrade_sticker — combine duplicates to upgrade level
- lingo_set_pfp — set a sticker as profile picture
```

### Claim achievements

```
1. Call lingo_achievements to see all achievements and unlock status
2. Call lingo_claim_achievement with the key (e.g., "first_win") to claim gems
```

### Use referral codes

```
- lingo_apply_referral — apply someone's referral code (one-time)
- lingo_referral_dashboard — view your referral earnings
- lingo_referral_withdraw — withdraw accumulated referral earnings
```

### Check jackpot

```
- lingo_jackpot_pool — current jackpot amount (no auth)
- lingo_jackpot_history — past jackpot winners (no auth)
The jackpot is won by solving a duel word on turn 1.
```

### Claim upvote reward

```
After voting for Lingo on the Abstract Portal (via the upvoting-on-abstract skill),
call lingo_upvote_claim with the epoch number to receive 50 gems.
```

## Wordle Strategy Tips

- **Start with vowel-rich words** like CRANE, SLATE, AUDIO, RAISE to maximize information.
- **Use feedback aggressively**: eliminate gray letters, lock green letters, reposition yellow letters.
- **Green tiles matter even after solving**: in duels, tiebreakers count total green tiles across all guesses. So even
  if you know the answer, consider the quality of your earlier guesses.
- **Turn 1 solve wins the jackpot**: if you're feeling lucky, guess a common word on turn 1 in a duel.

## Error Handling

| Error Message                   | Cause                                        | Fix                                            |
|---------------------------------|----------------------------------------------|-------------------------------------------------|
| `Login required`                | Missing or invalid Authorization header      | Add `Authorization: Bearer <token>` to headers  |
| `Player is busy`                | Player row locked by concurrent request      | Retry after a short delay                       |
| `Player not found`              | Invalid player ID or token                   | Re-authenticate                                 |
| `Match not found`               | Invalid match_id                             | Check match_id from create/history response     |
| `Match already completed`       | Trying to guess on a finished match          | Check status and start a new match              |
| `Invalid word`                  | Word not in dictionary                       | Use a valid 5-letter English word               |
| `Already guessed this word`     | Duplicate guess in same session              | Try a different word                            |
| `Maximum guesses reached`       | Used all 6 guesses                           | Game over — check result                        |
| `Deposit not found`             | Nonce not found on-chain                     | Verify deposit transaction confirmed            |
| `Already checked in today`      | Duplicate daily check-in                     | Wait until tomorrow                             |

## Escalation

- Route on-chain deposit/withdrawal to `executing-agw-transactions`.
- Route wallet balance checks to `reading-agw-wallet`.
- Route Abstract Portal voting to `upvoting-on-abstract`.
- Route app discovery to `discovering-abstract-portal`.
- Route AGW session setup to `authenticating-with-agw`.
