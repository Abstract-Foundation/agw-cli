# SignedVault Contract Reference

## Contents

- Contract Details
- Full Interface
- Deposit Flow
- Withdrawal Flow
- Error Reference

## Contract Details

| Property          | Value                                        |
|-------------------|----------------------------------------------|
| Name              | SignedVault                                   |
| Address (Mainnet) | `0xF5005cCA582Cb510D15d4D025F78C9258ec07F4b` |
| Resolver Address  | `0xde27F91F4A1CA98AfD519315432424b7d0346e3C` |
| Chain             | Abstract Mainnet (chain ID 2741)             |
| Compiler          | Solidity v0.8.30                              |
| Pattern           | UUPS Upgradeable + EIP-712 signed withdrawals|

## Full Interface

### Deposit Functions

```solidity
// Deposit ETH for a duel bet. Send ETH as msg.value.
function depositETH(address resolver, uint256 nonce) external payable

// Deposit ERC-20 tokens (not used for standard ETH duels)
function deposit(address token, uint256 amount, address resolver, uint256 nonce) external

// Deposit ERC-20 via Permit2 gasless approval
function depositWithPermit2(address resolver, PermitTransferFrom permit, bytes signature, uint256 nonce) external
```

### Withdrawal Functions

```solidity
// Withdraw ETH winnings using a resolver-signed authorization
function withdrawETH(address user, uint256 amount, address resolver, uint256 nonce, uint256 deadline, bytes signature) external

// Withdraw ERC-20 tokens (similar to withdrawETH but for tokens)
function withdraw(address user, address token, uint256 amount, address resolver, uint256 nonce, uint256 deadline, bytes signature) external
```

### Nonce Management

```solidity
// Cancel a nonce to prevent its future use (resolver only)
function cancel(uint256 nonce) external
```

### View Functions

```solidity
// Check deposit amount by (user, token, resolver, nonce)
function getDeposit(address user, address token, address resolver, uint256 nonce) external view returns (uint256 amount)

// Check deposit amount by hash
function getDeposit(bytes32 depositHash) external view returns (uint256 amount)

// Check if a nonce has been used
function usedNonces(address resolver, uint256 nonce) external view returns (bool used)

// Check total balance held by a resolver for a token
function resolverBalanceOf(address resolver, address token) external view returns (uint256 balance)

// Sentinel address representing native ETH
function ETH_ADDRESS() external view returns (address)  // always 0x0
```

## Events

```solidity
event Deposit(address user, address token, address resolver, uint256 amount, uint256 nonce)
event Withdraw(address user, address token, uint256 amount)
event NonceCancelled(address resolver, uint256 nonce)
```

## Custom Errors

| Error                          | Cause                                                |
|--------------------------------|------------------------------------------------------|
| `NonceAlreadyUsed`             | Nonce was already consumed for this resolver         |
| `InvalidAmount`                | Zero amount sent                                     |
| `InvalidAsset`                 | Used ETH address for ERC-20 function or vice versa   |
| `InvalidResolver`              | Zero-address resolver                                |
| `DuplicateDeposit`             | Same (user, token, resolver, nonce) already deposited|
| `InsufficientResolverBalance`  | Resolver doesn't hold enough funds to pay out        |
| `InvalidSignature`             | Withdrawal signature doesn't recover to resolver     |
| `SignatureExpired`             | Block timestamp past the deadline                    |
| `ETHTransferFailed`            | Native ETH transfer to user reverted                 |

## Deposit Flow

1. Pick a random unused nonce (e.g., current unix timestamp in seconds).
2. Call `depositETH(resolver, nonce)` with `value` set to the tier bet amount.
3. Wait for transaction confirmation.
4. Pass the same nonce as `deposit_nonce` when calling `lingo_duel_create`.

## Withdrawal Flow

1. After winning a duel, call `lingo_duel_status` to get `withdrawal_signature`, `withdrawal_nonce`, and `withdrawal_deadline`.
2. Call `withdrawETH(user, amount, resolver, nonce, deadline, signature)` on-chain.
3. If you also won the jackpot (turn-1 solve), make a **separate** `withdrawETH` call using the `jackpot_withdrawal_signature`, `jackpot_nonce`, and `jackpot_deadline` fields.
