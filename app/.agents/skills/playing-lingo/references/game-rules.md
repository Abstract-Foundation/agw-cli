# Lingo Game Rules Reference

## Overview

Lingo is a competitive Wordle-style word guessing game on Abstract chain with ETH betting.

## Basic Mechanics

- Guess a **5-letter English word**
- Up to **6 guesses** per game
- After each guess, per-tile feedback is returned:
  - **GREEN**: correct letter in correct position
  - **YELLOW**: correct letter in wrong position
  - **GRAY**: letter not in the word

## Game Modes

### Practice (vs Bot)

- Free to play, no ETH required
- Bot always solves on turn 4
- Good for warming up or testing word strategies
- Awards gems on completion

### Duel (1v1 PvP with ETH)

- Both players guess a word (each player gets a different word)
- **IMPORTANT**: You can start guessing immediately after creating a match, even in "waiting" status (before an opponent joins). Do NOT wait.
- Match ends when both players finish (solved or exhausted all 6 guesses)
- Requires an on-chain ETH deposit before creating a match

## Winner Determination

Applied in order (both practice and duel):

1. **Solver wins**: if one player solved and the other didn't, solver wins
2. **Fewer turns**: if both solved, the player who solved in fewer turns wins
3. **More greens**: if tied on turns, the player with more total green tiles across all guesses wins
4. **More yellows**: if tied on greens, more total yellow tiles wins
5. **Coin flip**: if completely tied, 50/50 random

**Strategy implication**: tile quality matters even after you've identified the word. Maximize green tiles across all guesses.

## Betting Tiers

| Tier    | Bet Amount | Winner Reward | Jackpot Cut | Protocol Fee | Gem Reward |
|---------|-----------|---------------|-------------|-------------|------------|
| casual  | 0.001 ETH | 0.0019 ETH    | 2.5%        | 2.5%        | 10 gems    |
| shrimp  | 0.01 ETH  | 0.019 ETH     | 2.5%        | 2.5%        | 50 gems    |
| whale   | 0.1 ETH   | 0.19 ETH      | 2.5%        | 2.5%        | 250 gems   |

- Fee structure: 5% total (2.5% to jackpot pool + 2.5% protocol fee)
- Winner receives 95% of both players' combined bets
- Both players earn gems regardless of outcome

## Jackpot

- Solving the word on **turn 1** (first guess) in a duel triggers the jackpot
- The jackpot pool accumulates from 2.5% of every duel bet
- Jackpot winnings require a **separate** on-chain withdrawal (distinct from match winnings)

## LP Rank System

Players earn LP (League Points) from duel wins and lose LP from losses.

| Rank   | LP Threshold |
|--------|-------------|
| Bronze | 0 - 299     |
| Silver | 300+        |
| Gold   | 600+        |

- No demotion: LP has a floor at the minimum for your current rank
- Win streaks are tracked but do not provide bonus LP

## Economy

### Gems

- Earned via: daily check-in, duel completion, achievement claims, upvote rewards
- Spent on: nickname changes (100 gems after first), hints (100 gems one-time), sticker packs (200 gems)

### Daily Check-in

| Streak Days | Gems Earned |
|------------|-------------|
| 1          | 10          |
| 2          | 20          |
| 3          | 30          |
| 4          | 40          |
| 5+         | 50          |

Missing a day resets the streak.

### Stickers

- Purchased via sticker packs (200 gems, random level-1 sticker)
- Can be upgraded by consuming duplicates
- Can be set as profile picture
- Level 2 requires 10 value (10x Lv1), Level 3 requires 100 value

### Achievements

- Unlocked automatically based on player stats (wins, streaks, etc.)
- Hidden achievements only appear after unlocking
- Each achievement awards gems when claimed
