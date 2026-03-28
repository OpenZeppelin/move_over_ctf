import type { Difficulty } from "./types";

interface LevelMeta {
  id: number;
  difficulty: Difficulty;
  contractCode: string;
  contractModules: Array<{
    module: string;
    contractCode: string;
  }>;
}

export const LEVEL_META: LevelMeta[] = [
  {
    id: 0,
    difficulty: "easy",
    contractCode: `module move_over::artifact;

public struct Artifact has key {
    id: UID,
    power: u64,
}

public struct ArtifactFlag has copy, drop {}

public fun forge(ctx: &mut TxContext): Artifact {
    Artifact {
        id: object::new(ctx),
        power: 0,
    }
}

public fun charge(artifact: &mut Artifact, energy: u64) {
    artifact.power = artifact.power + energy;
}

public fun shatter(artifact: Artifact): ArtifactFlag {
    let Artifact { id, power } = artifact;
    assert!(power == 100, 0);
    id.delete();
    ArtifactFlag {}
}`,
    contractModules: [
      {
        module: "artifact",
        contractCode: `module move_over::artifact;

public struct Artifact has key {
    id: UID,
    power: u64,
}

public struct ArtifactFlag has copy, drop {}

public fun forge(ctx: &mut TxContext): Artifact {
    Artifact {
        id: object::new(ctx),
        power: 0,
    }
}

public fun charge(artifact: &mut Artifact, energy: u64) {
    artifact.power = artifact.power + energy;
}

public fun shatter(artifact: Artifact): ArtifactFlag {
    let Artifact { id, power } = artifact;
    assert!(power == 100, 0);
    id.delete();
    ArtifactFlag {}
}`,
      },
    ],
  },
  {
    id: 1,
    difficulty: "easy",
    contractCode: `module move_over::coin_collector;

public struct Token has key, store {
    id: UID,
    value: u64,
}

public struct CoinCollectorFlag has copy, drop {}

public fun faucet(ctx: &mut TxContext): Token {
    Token { id: object::new(ctx), value: 100 }
}

public fun split(token: &mut Token, amount: u64, ctx: &mut TxContext): Token {
    assert!(token.value >= amount, 0);
    token.value = token.value - amount;
    Token { id: object::new(ctx), value: amount }
}

public fun merge(token: &mut Token, other: Token) {
    let Token { id, value } = other;
    id.delete();
    token.value = token.value + value;
}

public fun buy_prize(payment: Token): CoinCollectorFlag {
    let Token { id, value: _ } = payment;
    id.delete();
    CoinCollectorFlag {}
}

public fun value(token: &Token): u64 {
    token.value
}

public fun destroy_zero(token: Token) {
    assert!(token.value == 0, 0);
    let Token { id, value: _ } = token;
    id.delete();
}`,
    contractModules: [
      {
        module: "coin_collector",
        contractCode: `module move_over::coin_collector;

public struct Token has key, store {
    id: UID,
    value: u64,
}

public struct CoinCollectorFlag has copy, drop {}

public fun faucet(ctx: &mut TxContext): Token {
    Token { id: object::new(ctx), value: 100 }
}

public fun split(token: &mut Token, amount: u64, ctx: &mut TxContext): Token {
    assert!(token.value >= amount, 0);
    token.value = token.value - amount;
    Token { id: object::new(ctx), value: amount }
}

public fun merge(token: &mut Token, other: Token) {
    let Token { id, value } = other;
    id.delete();
    token.value = token.value + value;
}

public fun buy_prize(payment: Token): CoinCollectorFlag {
    let Token { id, value: _ } = payment;
    id.delete();
    CoinCollectorFlag {}
}

public fun value(token: &Token): u64 {
    token.value
}

public fun destroy_zero(token: Token) {
    assert!(token.value == 0, 0);
    let Token { id, value: _ } = token;
    id.delete();
}`,
      },
    ],
  },
  {
    id: 3,
    difficulty: "easy",
    contractCode: `module move_over::sticky_treasure;

use sui::dynamic_field as df;

public struct Chest has key {
    id: UID,
}

public struct Prize has store, copy, drop {
    value: u64,
}

public struct StickyTreasureFlag has copy, drop {}

public fun create(ctx: &mut TxContext): Chest {
    let mut chest = Chest { id: object::new(ctx) };
    df::add(&mut chest.id, b"prize", Prize { value: 1000 });
    chest
}

public fun smash(chest: Chest): Prize {
    let Chest { id } = chest;
    id.delete();
    Prize { value: 0 }
}

public fun has_prize(chest: &Chest): bool {
    df::exists_(&chest.id, b"prize")
}

public fun extract_prize(chest: &mut Chest): Prize {
    df::remove(&mut chest.id, b"prize")
}

public fun discard(chest: Chest) {
    let Chest { id } = chest;
    id.delete();
}

public fun solve(prize: Prize): StickyTreasureFlag {
    assert!(prize.value == 1000, 0);
    StickyTreasureFlag {}
}`,
    contractModules: [
      {
        module: "sticky_treasure",
        contractCode: `module move_over::sticky_treasure;

use sui::dynamic_field as df;

public struct Chest has key {
    id: UID,
}

public struct Prize has store, copy, drop {
    value: u64,
}

public struct StickyTreasureFlag has copy, drop {}

public fun create(ctx: &mut TxContext): Chest {
    let mut chest = Chest { id: object::new(ctx) };
    df::add(&mut chest.id, b"prize", Prize { value: 1000 });
    chest
}

public fun smash(chest: Chest): Prize {
    let Chest { id } = chest;
    id.delete();
    Prize { value: 0 }
}

public fun has_prize(chest: &Chest): bool {
    df::exists_(&chest.id, b"prize")
}

public fun extract_prize(chest: &mut Chest): Prize {
    df::remove(&mut chest.id, b"prize")
}

public fun discard(chest: Chest) {
    let Chest { id } = chest;
    id.delete();
}

public fun solve(prize: Prize): StickyTreasureFlag {
    assert!(prize.value == 1000, 0);
    StickyTreasureFlag {}
}`,
      },
    ],
  },
  {
    id: 4,
    difficulty: "easy",
    contractCode: `module move_over::sticky_treasure_dof;

use sui::dynamic_object_field as dof;

public struct Chest has key {
    id: UID,
}

/// Key for the dynamic object field (struct key instead of a bare byte string).
public struct PrizeKey has copy, drop, store {
    name: vector<u8>,
}

public struct Prize has key, store {
    id: UID,
    value: u64,
}

public struct ObjectChestFlag has copy, drop {}

fun prize_key(): PrizeKey {
    PrizeKey { name: b"prize" }
}

public fun create(ctx: &mut TxContext): Chest {
    let mut chest = Chest { id: object::new(ctx) };
    let prize = Prize { id: object::new(ctx), value: 2000 };
    dof::add(&mut chest.id, prize_key(), prize);
    chest
}

public fun smash(chest: Chest, ctx: &mut TxContext): Prize {
    let Chest { id } = chest;
    id.delete();
    Prize { id: object::new(ctx), value: 0 }
}

public fun has_prize(chest: &Chest): bool {
    dof::exists_(&chest.id, prize_key())
}

public fun extract_prize(chest: &mut Chest): Prize {
    dof::remove(&mut chest.id, prize_key())
}

public fun discard(chest: Chest) {
    let Chest { id } = chest;
    id.delete();
}

public fun solve(prize: Prize): ObjectChestFlag {
    assert!(prize.value == 2000, 0);
    let Prize { id, value: _ } = prize;
    id.delete();
    ObjectChestFlag {}
}`,
    contractModules: [
      {
        module: "sticky_treasure_dof",
        contractCode: `module move_over::sticky_treasure_dof;

use sui::dynamic_object_field as dof;

public struct Chest has key {
    id: UID,
}

/// Key for the dynamic object field (struct key instead of a bare byte string).
public struct PrizeKey has copy, drop, store {
    name: vector<u8>,
}

public struct Prize has key, store {
    id: UID,
    value: u64,
}

public struct ObjectChestFlag has copy, drop {}

fun prize_key(): PrizeKey {
    PrizeKey { name: b"prize" }
}

public fun create(ctx: &mut TxContext): Chest {
    let mut chest = Chest { id: object::new(ctx) };
    let prize = Prize { id: object::new(ctx), value: 2000 };
    dof::add(&mut chest.id, prize_key(), prize);
    chest
}

public fun smash(chest: Chest, ctx: &mut TxContext): Prize {
    let Chest { id } = chest;
    id.delete();
    Prize { id: object::new(ctx), value: 0 }
}

public fun has_prize(chest: &Chest): bool {
    dof::exists_(&chest.id, prize_key())
}

public fun extract_prize(chest: &mut Chest): Prize {
    dof::remove(&mut chest.id, prize_key())
}

public fun discard(chest: Chest) {
    let Chest { id } = chest;
    id.delete();
}

public fun solve(prize: Prize): ObjectChestFlag {
    assert!(prize.value == 2000, 0);
    let Prize { id, value: _ } = prize;
    id.delete();
    ObjectChestFlag {}
}`,
      },
    ],
  },
  {
    id: 5,
    difficulty: "easy",
    contractCode: `module move_over::flash_vault;

public struct Token has key, store {
    id: UID,
    value: u64,
}

public struct FlashVault has key {
    id: UID,
    balance: u64,
    next_nonce: u64,
}

/// No abilities — must be consumed within the transaction.
public struct Receipt {
    vault_id: ID,
    borrower: address,
    nonce: u64,
    amount: u64,
}

public struct FlashVaultFlag has copy, drop {}

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_VAULT: u64 = 2;
const EWRONG_BORROWER: u64 = 3;
const ENONCE_MISMATCH: u64 = 4;
const EINSUFFICIENT_REPAYMENT: u64 = 5;
const ENOT_DRAINED: u64 = 6;

/// Initialize the flash loan vault with available liquidity.
public fun create_vault(amount: u64, ctx: &mut TxContext): FlashVault {
    FlashVault {
        id: object::new(ctx),
        balance: amount,
        next_nonce: 1,
    }
}

/// Borrow tokens from the vault. Returns a token and a receipt that must be settled.
public fun borrow(vault: &mut FlashVault, amount: u64, ctx: &mut TxContext): (Token, Receipt) {
    assert!(amount > 0, EZERO_AMOUNT);
    assert!(vault.balance >= amount, EINSUFFICIENT_LIQUIDITY);
    let nonce = vault.next_nonce;
    vault.balance = vault.balance - amount;
    vault.next_nonce = nonce + 1;
    (
        Token { id: object::new(ctx), value: amount },
        Receipt {
            vault_id: object::id(&vault.id),
            borrower: ctx.sender(),
            nonce,
            amount,
        },
    )
}

/// Repay the borrowed amount. Settles the receipt.
public fun repay(vault: &mut FlashVault, receipt: Receipt, payment: Token, ctx: &TxContext) {
    let Receipt {
        vault_id,
        borrower,
        nonce,
        amount,
    } = receipt;
    assert!(vault_id == object::id(&vault.id), EWRONG_VAULT);
    assert!(borrower == ctx.sender(), EWRONG_BORROWER);
    assert!(nonce + 1 == vault.next_nonce, ENONCE_MISMATCH);
    assert!(payment.value >= amount, EINSUFFICIENT_REPAYMENT);
    let Token { id, value } = payment;
    id.delete();
    vault.balance = vault.balance + value;
}

/// Cancel a pending borrow to start over.
public fun cancel(vault: &mut FlashVault, receipt: Receipt, ctx: &TxContext) {
    let Receipt {
        vault_id,
        borrower,
        nonce,
        amount: _,
    } = receipt;
    assert!(vault_id == object::id(&vault.id), EWRONG_VAULT);
    assert!(borrower == ctx.sender(), EWRONG_BORROWER);
    assert!(nonce + 1 == vault.next_nonce, ENONCE_MISMATCH);
}

/// Prove you drained the vault.
public fun solve(vault: FlashVault): FlashVaultFlag {
    assert!(vault.balance == 0, ENOT_DRAINED);
    let FlashVault {
        id,
        balance: _,
        next_nonce: _,
    } = vault;
    id.delete();
    FlashVaultFlag {}
}`,
    contractModules: [
      {
        module: "flash_vault",
        contractCode: `module move_over::flash_vault;

public struct Token has key, store {
    id: UID,
    value: u64,
}

public struct FlashVault has key {
    id: UID,
    balance: u64,
    next_nonce: u64,
}

/// No abilities — must be consumed within the transaction.
public struct Receipt {
    vault_id: ID,
    borrower: address,
    nonce: u64,
    amount: u64,
}

public struct FlashVaultFlag has copy, drop {}

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_VAULT: u64 = 2;
const EWRONG_BORROWER: u64 = 3;
const ENONCE_MISMATCH: u64 = 4;
const EINSUFFICIENT_REPAYMENT: u64 = 5;
const ENOT_DRAINED: u64 = 6;

/// Initialize the flash loan vault with available liquidity.
public fun create_vault(amount: u64, ctx: &mut TxContext): FlashVault {
    FlashVault {
        id: object::new(ctx),
        balance: amount,
        next_nonce: 1,
    }
}

/// Borrow tokens from the vault. Returns a token and a receipt that must be settled.
public fun borrow(vault: &mut FlashVault, amount: u64, ctx: &mut TxContext): (Token, Receipt) {
    assert!(amount > 0, EZERO_AMOUNT);
    assert!(vault.balance >= amount, EINSUFFICIENT_LIQUIDITY);
    let nonce = vault.next_nonce;
    vault.balance = vault.balance - amount;
    vault.next_nonce = nonce + 1;
    (
        Token { id: object::new(ctx), value: amount },
        Receipt {
            vault_id: object::id(&vault.id),
            borrower: ctx.sender(),
            nonce,
            amount,
        },
    )
}

/// Repay the borrowed amount. Settles the receipt.
public fun repay(vault: &mut FlashVault, receipt: Receipt, payment: Token, ctx: &TxContext) {
    let Receipt {
        vault_id,
        borrower,
        nonce,
        amount,
    } = receipt;
    assert!(vault_id == object::id(&vault.id), EWRONG_VAULT);
    assert!(borrower == ctx.sender(), EWRONG_BORROWER);
    assert!(nonce + 1 == vault.next_nonce, ENONCE_MISMATCH);
    assert!(payment.value >= amount, EINSUFFICIENT_REPAYMENT);
    let Token { id, value } = payment;
    id.delete();
    vault.balance = vault.balance + value;
}

/// Cancel a pending borrow to start over.
public fun cancel(vault: &mut FlashVault, receipt: Receipt, ctx: &TxContext) {
    let Receipt {
        vault_id,
        borrower,
        nonce,
        amount: _,
    } = receipt;
    assert!(vault_id == object::id(&vault.id), EWRONG_VAULT);
    assert!(borrower == ctx.sender(), EWRONG_BORROWER);
    assert!(nonce + 1 == vault.next_nonce, ENONCE_MISMATCH);
}

/// Prove you drained the vault.
public fun solve(vault: FlashVault): FlashVaultFlag {
    assert!(vault.balance == 0, ENOT_DRAINED);
    let FlashVault {
        id,
        balance: _,
        next_nonce: _,
    } = vault;
    id.delete();
    FlashVaultFlag {}
}`,
      },
    ],
  },
  {
    id: 6,
    difficulty: "medium",
    contractCode: `module move_over::pool_party;

public struct Pool has key {
    id: UID,
    name: vector<u8>,
    balance: u64,
    next_nonce: u64,
}

/// No abilities — must be consumed within the transaction.
public struct Receipt {
    pool_id: ID,
    borrower: address,
    nonce: u64,
    amount: u64,
}

public struct PoolPartyFlag has copy, drop {}

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_BORROWER: u64 = 2;
const ENONCE_MISMATCH: u64 = 3;
const EINSUFFICIENT_REPAYMENT: u64 = 4;
const ENOT_DRAINED: u64 = 5;
const EINVALID_POOL_ID: u64 = 6;

public fun create_pool_a(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Treasury",
        balance: 100_000,
        next_nonce: 3,
    }
}

public fun create_pool_b(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"DryRun",
        balance: 0,
        next_nonce: 1,
    }
}

public fun create_pool_c(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Auxiliary",
        balance: 10,
        next_nonce: 2,
    }
}

public fun borrow(pool: &mut Pool, amount: u64, ctx: &TxContext): (u64, Receipt) {
    assert!(amount > 0, EZERO_AMOUNT);
    assert!(pool.balance >= amount, EINSUFFICIENT_LIQUIDITY);
    let nonce = pool.next_nonce;
    pool.balance = pool.balance - amount;
    pool.next_nonce = nonce + 1;
    let receipt = Receipt {
        pool_id: object::id(&pool.id),
        borrower: tx_context::sender(ctx),
        nonce,
        amount,
    };
    (amount, receipt)
}

public fun repay(
    pool: &mut Pool,
    receipt_pool_id: ID,
    receipt: Receipt,
    repayment: u64,
    ctx: &TxContext,
) {
    let Receipt {
        pool_id,
        borrower,
        nonce,
        amount,
    } = receipt;
    assert!(pool_id == receipt_pool_id, EINVALID_POOL_ID);
    assert!(borrower == tx_context::sender(ctx), EWRONG_BORROWER);
    assert!(nonce + 1 == pool.next_nonce, ENONCE_MISMATCH);
    assert!(repayment >= amount, EINSUFFICIENT_REPAYMENT);
    pool.balance = pool.balance + repayment;
}

public fun solve(pool_a: Pool): PoolPartyFlag {
    assert!(pool_a.balance == 0, ENOT_DRAINED);
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
    } = pool_a;
    id.delete();
    PoolPartyFlag {}
}

public fun destroy_pool(pool: Pool) {
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
    } = pool;
    id.delete();
}

/// Getter functions
public fun pool_id(pool: &Pool): ID {
    object::id(&pool.id)
}

public fun balance(pool: &Pool): u64 {
    pool.balance
}

public fun next_nonce(pool: &Pool): u64 {
    pool.next_nonce
}`,
    contractModules: [
      {
        module: "pool_party",
        contractCode: `module move_over::pool_party;

public struct Pool has key {
    id: UID,
    name: vector<u8>,
    balance: u64,
    next_nonce: u64,
}

/// No abilities — must be consumed within the transaction.
public struct Receipt {
    pool_id: ID,
    borrower: address,
    nonce: u64,
    amount: u64,
}

public struct PoolPartyFlag has copy, drop {}

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_BORROWER: u64 = 2;
const ENONCE_MISMATCH: u64 = 3;
const EINSUFFICIENT_REPAYMENT: u64 = 4;
const ENOT_DRAINED: u64 = 5;
const EINVALID_POOL_ID: u64 = 6;

public fun create_pool_a(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Treasury",
        balance: 100_000,
        next_nonce: 3,
    }
}

public fun create_pool_b(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"DryRun",
        balance: 0,
        next_nonce: 1,
    }
}

public fun create_pool_c(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Auxiliary",
        balance: 10,
        next_nonce: 2,
    }
}

public fun borrow(pool: &mut Pool, amount: u64, ctx: &TxContext): (u64, Receipt) {
    assert!(amount > 0, EZERO_AMOUNT);
    assert!(pool.balance >= amount, EINSUFFICIENT_LIQUIDITY);
    let nonce = pool.next_nonce;
    pool.balance = pool.balance - amount;
    pool.next_nonce = nonce + 1;
    let receipt = Receipt {
        pool_id: object::id(&pool.id),
        borrower: tx_context::sender(ctx),
        nonce,
        amount,
    };
    (amount, receipt)
}

public fun repay(
    pool: &mut Pool,
    receipt_pool_id: ID,
    receipt: Receipt,
    repayment: u64,
    ctx: &TxContext,
) {
    let Receipt {
        pool_id,
        borrower,
        nonce,
        amount,
    } = receipt;
    assert!(pool_id == receipt_pool_id, EINVALID_POOL_ID);
    assert!(borrower == tx_context::sender(ctx), EWRONG_BORROWER);
    assert!(nonce + 1 == pool.next_nonce, ENONCE_MISMATCH);
    assert!(repayment >= amount, EINSUFFICIENT_REPAYMENT);
    pool.balance = pool.balance + repayment;
}

public fun solve(pool_a: Pool): PoolPartyFlag {
    assert!(pool_a.balance == 0, ENOT_DRAINED);
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
    } = pool_a;
    id.delete();
    PoolPartyFlag {}
}

public fun destroy_pool(pool: Pool) {
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
    } = pool;
    id.delete();
}

/// Getter functions
public fun pool_id(pool: &Pool): ID {
    object::id(&pool.id)
}

public fun balance(pool: &Pool): u64 {
    pool.balance
}

public fun next_nonce(pool: &Pool): u64 {
    pool.next_nonce
}`,
      },
    ],
  },
];
