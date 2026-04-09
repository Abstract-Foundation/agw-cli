# Lingo MCP Tools Reference

All tools are accessed via the Lingo MCP server at `/mcp`. Authentication is via `Authorization: Bearer <accessToken>` header
unless noted otherwise.

## Practice Mode (free, no ETH)

| Tool                     | Auth | Description                                                                    |
|--------------------------|------|--------------------------------------------------------------------------------|
| `lingo_practice_start`   | Yes  | Start a new practice game vs bot. Bot solves on turn 4.                        |
| `lingo_practice_guess`   | Yes  | Submit a 5-letter guess. Returns per-tile feedback (green/yellow/gray).        |
| `lingo_practice_status`  | Yes  | Get current state of a practice session including all guesses and feedback.    |
| `lingo_practice_history` | Yes  | Paginated list of past practice games.                                         |

### Practice parameters

- `lingo_practice_guess`: `session_id` (uuid), `word` (5 letters)
- `lingo_practice_status`: `session_id` (uuid)
- `lingo_practice_history`: `limit` (1-100, default 20), `offset` (default 0)

## Duel Mode (ETH betting, PvP)

| Tool                       | Auth | Description                                                                 |
|----------------------------|------|-----------------------------------------------------------------------------|
| `lingo_duel_create`        | Yes  | Create or join a duel. Requires on-chain deposit first.                     |
| `lingo_duel_guess`         | Yes  | Submit a guess. Works in both "waiting" and "in_progress" status.           |
| `lingo_duel_status`        | Yes  | Get match state. Winner gets withdrawal signature in response.              |
| `lingo_duel_waiting`       | No   | List public matches waiting for opponents in a tier.                        |
| `lingo_duel_invite_lookup` | No   | Look up a private room by 6-letter invite code.                             |
| `lingo_duel_history`       | Yes  | Paginated duel match history with results.                                  |
| `lingo_duel_force_complete`| Yes  | Force-complete a match stuck for 3+ days.                                   |

### Duel parameters

- `lingo_duel_create`: `tier` (casual/shrimp/whale), `deposit_nonce` (string), `is_private` (bool, optional), `invite_code` (6 letters, optional)
- `lingo_duel_guess`: `match_id` (uuid), `word` (5 letters)
- `lingo_duel_status`: `match_id` (uuid)
- `lingo_duel_waiting`: `tier` (casual/shrimp/whale), `limit` (1-100, optional)
- `lingo_duel_invite_lookup`: `invite_code` (6 letters)
- `lingo_duel_history`: `limit` (1-100), `offset`
- `lingo_duel_force_complete`: `match_id` (uuid)

## Player & Profile

| Tool                   | Auth | Description                                                        |
|------------------------|------|--------------------------------------------------------------------|
| `lingo_player_stats`   | Yes  | Comprehensive stats: wins, losses, ETH, LP, rank, gems, streaks.  |
| `lingo_player_profile` | No*  | Player profile + recent matches. Omit `player_id` for own profile. |
| `lingo_set_nickname`   | Yes  | Set nickname (2-14 chars, alphanumeric + underscore). First free, then 100 gems. |
| `lingo_set_pfp`        | Yes  | Set an owned sticker as profile picture.                           |
| `lingo_leaderboard`    | No   | LP leaderboard rankings.                                          |

## Economy (Gems, Stickers, Check-in)

| Tool                         | Auth | Description                                                    |
|------------------------------|------|----------------------------------------------------------------|
| `lingo_checkin`              | Yes  | Daily check-in for gems. Streak: 10/20/30/40/50 gems.         |
| `lingo_purchase_hints`       | Yes  | Unlock hints permanently for 100 gems (one-time).              |
| `lingo_purchase_sticker_pack`| Yes  | Buy random sticker pack for 200 gems.                          |
| `lingo_my_stickers`          | Yes  | List all owned stickers with counts and levels.                |
| `lingo_all_stickers`         | No   | List all available stickers in the game.                       |
| `lingo_sticker_confirm`      | Yes  | Sync sticker state.                                            |
| `lingo_upgrade_sticker`      | Yes  | Upgrade sticker level by consuming duplicates.                 |

### Sticker upgrade costs

- Level 2: requires 10 value (10x Lv1 or 1x Lv2)
- Level 3: requires 100 value (100x Lv1 or 10x Lv2 or mix)
- Lv1 = 1 value, Lv2 = 10 value

## Achievements

| Tool                      | Auth | Description                                          |
|---------------------------|------|------------------------------------------------------|
| `lingo_achievements`      | Yes  | List all achievements. Hidden ones appear after unlock. |
| `lingo_claim_achievement` | Yes  | Claim gem reward for unlocked achievement.           |

- `lingo_claim_achievement`: `key` (e.g., "first_win", "wins_10")

## Jackpot

| Tool                   | Auth | Description                                       |
|------------------------|------|---------------------------------------------------|
| `lingo_jackpot_pool`   | No   | Current jackpot pool amount.                      |
| `lingo_jackpot_history`| No   | History of jackpot winners.                       |

## Referral

| Tool                        | Auth | Description                                       |
|-----------------------------|------|---------------------------------------------------|
| `lingo_apply_referral`      | Yes  | Apply a referral code (one-time).                 |
| `lingo_referral_dashboard`  | Yes  | View referral earnings and referred players.      |
| `lingo_referral_withdraw`   | Yes  | Withdraw accumulated referral earnings.           |
| `lingo_referral_withdrawals`| Yes  | View referral withdrawal history.                 |

## Upvote Reward

| Tool                | Auth | Description                                              |
|---------------------|------|----------------------------------------------------------|
| `lingo_upvote_claim`| Yes  | Claim 50 gems for voting for Lingo on-chain in an epoch. |
