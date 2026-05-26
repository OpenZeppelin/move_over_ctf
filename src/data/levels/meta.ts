import type { Difficulty } from "./types";

interface LevelMeta {
  id: string;
  difficulty: Difficulty;
  contractCode: string;
  contractModules: Array<{
    module: string;
    contractCode: string;
  }>;
}

export const LEVEL_META: LevelMeta[] = [
  {
    id: "artifact",
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
    id: "coin_collector",
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
    id: "sticky_treasure",
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
    id: "flash_vault",
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

const VAULT_LIQUIDITY: u64 = 1_000;

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_VAULT: u64 = 2;
const EWRONG_BORROWER: u64 = 3;
const ENONCE_MISMATCH: u64 = 4;
const EINSUFFICIENT_REPAYMENT: u64 = 5;
const ENOT_DRAINED: u64 = 6;

/// Initialize the flash loan vault with a fixed amount of liquidity.
public fun create_vault(ctx: &mut TxContext): FlashVault {
    FlashVault {
        id: object::new(ctx),
        balance: VAULT_LIQUIDITY,
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

const VAULT_LIQUIDITY: u64 = 1_000;

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_VAULT: u64 = 2;
const EWRONG_BORROWER: u64 = 3;
const ENONCE_MISMATCH: u64 = 4;
const EINSUFFICIENT_REPAYMENT: u64 = 5;
const ENOT_DRAINED: u64 = 6;

/// Initialize the flash loan vault with a fixed amount of liquidity.
public fun create_vault(ctx: &mut TxContext): FlashVault {
    FlashVault {
        id: object::new(ctx),
        balance: VAULT_LIQUIDITY,
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
    id: "pool_party",
    difficulty: "medium",
    contractCode: `module move_over::pool_party;

public struct Pool has key {
    id: UID,
    name: vector<u8>,
    balance: u64,
    next_nonce: u64,
    is_treasury: bool,
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
const ENOT_TREASURY: u64 = 7;

public fun create_pool_a(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Treasury",
        balance: 100_000,
        next_nonce: 3,
        is_treasury: true,
    }
}

public fun create_pool_b(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"DryRun",
        balance: 0,
        next_nonce: 1,
        is_treasury: false,
    }
}

public fun create_pool_c(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Auxiliary",
        balance: 10,
        next_nonce: 2,
        is_treasury: false,
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
    assert!(pool_a.is_treasury, ENOT_TREASURY);
    assert!(pool_a.balance == 0, ENOT_DRAINED);
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
        is_treasury: _,
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
        is_treasury: _,
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
    is_treasury: bool,
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
const ENOT_TREASURY: u64 = 7;

public fun create_pool_a(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Treasury",
        balance: 100_000,
        next_nonce: 3,
        is_treasury: true,
    }
}

public fun create_pool_b(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"DryRun",
        balance: 0,
        next_nonce: 1,
        is_treasury: false,
    }
}

public fun create_pool_c(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Auxiliary",
        balance: 10,
        next_nonce: 2,
        is_treasury: false,
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
    assert!(pool_a.is_treasury, ENOT_TREASURY);
    assert!(pool_a.balance == 0, ENOT_DRAINED);
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
        is_treasury: _,
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
        is_treasury: _,
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
  {
    id: "tick_tock",
    difficulty: "medium",
    contractCode: `module move_over::tick_tock;

public struct Pool has key {
    id: UID,
    total_liquidity: u128,
    token_balance: u64,
}

public struct LiquidityPosition has key, store {
    id: UID,
    liquidity: u128,
}

public struct TickTockFlag has copy, drop {}

const SCALE: u128 = 1 << 64;

public fun create_pool(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        total_liquidity: 1_000_000,
        token_balance: 1_000_000,
    }
}

public fun tick_to_sqrt_price(tick: u64): u128 {
    let shift = (tick / 100) as u8;
    1u128 << shift
}

public fun add_liquidity(
    pool: &mut Pool,
    deposit: u64,
    liquidity_amount: u128,
    tick: u64,
    ctx: &mut TxContext,
): LiquidityPosition {
    let sqrt_price = tick_to_sqrt_price(tick);
    let cost = (liquidity_amount * sqrt_price) / SCALE;
    assert!((deposit as u128) >= cost, 0);

    pool.token_balance = pool.token_balance + deposit;
    pool.total_liquidity = pool.total_liquidity + liquidity_amount;

    LiquidityPosition {
        id: object::new(ctx),
        liquidity: liquidity_amount,
    }
}

public fun remove_liquidity(
    pool: &mut Pool,
    position: LiquidityPosition,
): u64 {
    let LiquidityPosition { id, liquidity } = position;
    id.delete();

    let payout = ((liquidity * (pool.token_balance as u128))
        / pool.total_liquidity) as u64;

    assert!(pool.token_balance >= payout, 0);
    pool.token_balance = pool.token_balance - payout;
    pool.total_liquidity = pool.total_liquidity - liquidity;
    payout
}

public fun pool_balance(pool: &Pool): u64 {
    pool.token_balance
}

public fun pool_liquidity(pool: &Pool): u128 {
    pool.total_liquidity
}

public fun solve(pool: Pool): TickTockFlag {
    // Initial token_balance is 1_000_000; the pool is drained only when at
    // least 900_000 has been pulled out (token_balance <= 100_000).
    assert!(pool.token_balance <= 100_000, 0);
    let Pool { id, total_liquidity: _, token_balance: _ } = pool;
    id.delete();
    TickTockFlag {}
}`,
    contractModules: [
      {
        module: "tick_tock",
        contractCode: `module move_over::tick_tock;

public struct Pool has key {
    id: UID,
    total_liquidity: u128,
    token_balance: u64,
}

public struct LiquidityPosition has key, store {
    id: UID,
    liquidity: u128,
}

public struct TickTockFlag has copy, drop {}

const SCALE: u128 = 1 << 64;

public fun create_pool(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        total_liquidity: 1_000_000,
        token_balance: 1_000_000,
    }
}

public fun tick_to_sqrt_price(tick: u64): u128 {
    let shift = (tick / 100) as u8;
    1u128 << shift
}

public fun add_liquidity(
    pool: &mut Pool,
    deposit: u64,
    liquidity_amount: u128,
    tick: u64,
    ctx: &mut TxContext,
): LiquidityPosition {
    let sqrt_price = tick_to_sqrt_price(tick);
    let cost = (liquidity_amount * sqrt_price) / SCALE;
    assert!((deposit as u128) >= cost, 0);

    pool.token_balance = pool.token_balance + deposit;
    pool.total_liquidity = pool.total_liquidity + liquidity_amount;

    LiquidityPosition {
        id: object::new(ctx),
        liquidity: liquidity_amount,
    }
}

public fun remove_liquidity(
    pool: &mut Pool,
    position: LiquidityPosition,
): u64 {
    let LiquidityPosition { id, liquidity } = position;
    id.delete();

    let payout = ((liquidity * (pool.token_balance as u128))
        / pool.total_liquidity) as u64;

    assert!(pool.token_balance >= payout, 0);
    pool.token_balance = pool.token_balance - payout;
    pool.total_liquidity = pool.total_liquidity - liquidity;
    payout
}

public fun pool_balance(pool: &Pool): u64 {
    pool.token_balance
}

public fun pool_liquidity(pool: &Pool): u128 {
    pool.total_liquidity
}

public fun solve(pool: Pool): TickTockFlag {
    // Initial token_balance is 1_000_000; the pool is drained only when at
    // least 900_000 has been pulled out (token_balance <= 100_000).
    assert!(pool.token_balance <= 100_000, 0);
    let Pool { id, total_liquidity: _, token_balance: _ } = pool;
    id.delete();
    TickTockFlag {}
}`,
      },
    ],
  },
  {
    id: "night_ledger",
    difficulty: "hard",
    contractCode: `module move_over::night_ledger;

use move_over::night_ledger_math;

const EINSUFFICIENT_MARGIN: u64 = 0;
const EMULTIPLICATION_OVERFLOW: u64 = 1;
const EINSUFFICIENT_RESERVE: u64 = 2;
const EINSUFFICIENT_VALUE: u64 = 3;
const EZERO_LIQUIDITY: u64 = 4;
const EINVALID_MARGIN_NOTE: u64 = 5;

const INITIAL_RESERVE: u64 = 25_000_000;
const TARGET_VALUE: u64 = 10_000_000;
const PAYOUT_SHIFT: u8 = 28;

public struct Ledger has key {
    id: UID,
    reserve: u64,
    epoch: u64,
}

public struct MarginNote has key, store {
    id: UID,
    value: u64,
}

public struct Position has key, store {
    id: UID,
    liquidity: u128,
    margin_paid: u64,
    epoch: u64,
}

public struct NightLedgerFlag has copy, drop {}

fun root_price_0(): u128 {
    1u128 << 60
}

fun root_price_1(): u128 {
    (1u128 << 60) + (1u128 << 44) + 17u128
}

public fun bootstrap(ctx: &mut TxContext): Ledger {
    Ledger {
        id: object::new(ctx),
        reserve: INITIAL_RESERVE,
        epoch: 0,
    }
}

public fun faucet(ctx: &mut TxContext): MarginNote {
    MarginNote {
        id: object::new(ctx),
        value: 1,
    }
}

public fun open_position(
    ledger: &mut Ledger,
    payment: MarginNote,
    liquidity: u128,
    ctx: &mut TxContext,
): Position {
    assert!(liquidity > 0, EZERO_LIQUIDITY);

    let required = required_margin(liquidity);
    let MarginNote {
        id: payment_id,
        value,
    } = payment;
    assert!(value == 1, EINVALID_MARGIN_NOTE);
    assert!(value >= required, EINSUFFICIENT_MARGIN);
    payment_id.delete();

    ledger.reserve = ledger.reserve + required;
    let position = Position {
        id: object::new(ctx),
        liquidity,
        margin_paid: required,
        epoch: ledger.epoch,
    };
    ledger.epoch = ledger.epoch + 1;
    position
}

public fun close_position(ledger: &mut Ledger, position: Position, ctx: &mut TxContext): MarginNote {
    let Position {
        id,
        liquidity,
        margin_paid: _,
        epoch: _,
    } = position;
    id.delete();

    let payout = night_ledger_math::payout_from_liquidity(liquidity, PAYOUT_SHIFT);
    assert!(ledger.reserve >= payout, EINSUFFICIENT_RESERVE);
    ledger.reserve = ledger.reserve - payout;

    MarginNote {
        id: object::new(ctx),
        value: payout,
    }
}

public fun solve(note: MarginNote): NightLedgerFlag {
    let MarginNote { id, value } = note;
    assert!(value >= TARGET_VALUE, EINSUFFICIENT_VALUE);
    id.delete();
    NightLedgerFlag {}
}

public fun discard_ledger(ledger: Ledger) {
    let Ledger {
        id,
        reserve: _,
        epoch: _,
    } = ledger;
    id.delete();
}

public fun value(note: &MarginNote): u64 {
    note.value
}

fun required_margin(liquidity: u128): u64 {
    let (required, overflowing) =
        night_ledger_math::quote_required_margin(root_price_0(), root_price_1(), liquidity, true);
    if (overflowing) {
        abort EMULTIPLICATION_OVERFLOW
    };
    required
}`,
    contractModules: [
      {
        module: "night_ledger",
        contractCode: `module move_over::night_ledger;

use move_over::night_ledger_math;

const EINSUFFICIENT_MARGIN: u64 = 0;
const EMULTIPLICATION_OVERFLOW: u64 = 1;
const EINSUFFICIENT_RESERVE: u64 = 2;
const EINSUFFICIENT_VALUE: u64 = 3;
const EZERO_LIQUIDITY: u64 = 4;
const EINVALID_MARGIN_NOTE: u64 = 5;

const INITIAL_RESERVE: u64 = 25_000_000;
const TARGET_VALUE: u64 = 10_000_000;
const PAYOUT_SHIFT: u8 = 28;

public struct Ledger has key {
    id: UID,
    reserve: u64,
    epoch: u64,
}

public struct MarginNote has key, store {
    id: UID,
    value: u64,
}

public struct Position has key, store {
    id: UID,
    liquidity: u128,
    margin_paid: u64,
    epoch: u64,
}

public struct NightLedgerFlag has copy, drop {}

fun root_price_0(): u128 {
    1u128 << 60
}

fun root_price_1(): u128 {
    (1u128 << 60) + (1u128 << 44) + 17u128
}

public fun bootstrap(ctx: &mut TxContext): Ledger {
    Ledger {
        id: object::new(ctx),
        reserve: INITIAL_RESERVE,
        epoch: 0,
    }
}

public fun faucet(ctx: &mut TxContext): MarginNote {
    MarginNote {
        id: object::new(ctx),
        value: 1,
    }
}

public fun open_position(
    ledger: &mut Ledger,
    payment: MarginNote,
    liquidity: u128,
    ctx: &mut TxContext,
): Position {
    assert!(liquidity > 0, EZERO_LIQUIDITY);

    let required = required_margin(liquidity);
    let MarginNote {
        id: payment_id,
        value,
    } = payment;
    assert!(value == 1, EINVALID_MARGIN_NOTE);
    assert!(value >= required, EINSUFFICIENT_MARGIN);
    payment_id.delete();

    ledger.reserve = ledger.reserve + required;
    let position = Position {
        id: object::new(ctx),
        liquidity,
        margin_paid: required,
        epoch: ledger.epoch,
    };
    ledger.epoch = ledger.epoch + 1;
    position
}

public fun close_position(ledger: &mut Ledger, position: Position, ctx: &mut TxContext): MarginNote {
    let Position {
        id,
        liquidity,
        margin_paid: _,
        epoch: _,
    } = position;
    id.delete();

    let payout = night_ledger_math::payout_from_liquidity(liquidity, PAYOUT_SHIFT);
    assert!(ledger.reserve >= payout, EINSUFFICIENT_RESERVE);
    ledger.reserve = ledger.reserve - payout;

    MarginNote {
        id: object::new(ctx),
        value: payout,
    }
}

public fun solve(note: MarginNote): NightLedgerFlag {
    let MarginNote { id, value } = note;
    assert!(value >= TARGET_VALUE, EINSUFFICIENT_VALUE);
    id.delete();
    NightLedgerFlag {}
}

public fun discard_ledger(ledger: Ledger) {
    let Ledger {
        id,
        reserve: _,
        epoch: _,
    } = ledger;
    id.delete();
}

public fun value(note: &MarginNote): u64 {
    note.value
}

fun required_margin(liquidity: u128): u64 {
    let (required, overflowing) =
        night_ledger_math::quote_required_margin(root_price_0(), root_price_1(), liquidity, true);
    if (overflowing) {
        abort EMULTIPLICATION_OVERFLOW
    };
    required
}`,
      },
      {
        module: "night_ledger_math",
        contractCode: `module move_over::night_ledger_math;

const SHIFT_BITS: u8 = 32;
const HIGH_BITS_OFFSET: u8 = 96;

public fun full_mul_u128(a: u128, b: u128): u128 {
    a * b
}

public fun quote_required_margin(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    liquidity: u128,
    round_up: bool,
): (u64, bool) {
    quote_from_roots(sqrt_price_0, sqrt_price_1, liquidity, round_up)
}

public fun payout_from_liquidity(liquidity: u128, shift: u8): u64 {
    let scaled = (liquidity >> shift) as u64;
    if (scaled == 0) {
        1
    } else {
        scaled
    }
}

fun quote_from_roots(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    liquidity: u128,
    round_up: bool,
): (u64, bool) {
    let sqrt_price_diff = abs_diff(sqrt_price_0, sqrt_price_1);

    if (sqrt_price_diff == 0 || liquidity == 0) {
        return (0, false)
    };

    let (numerator, overflowing) = checked_shlw(full_mul_u128(liquidity, sqrt_price_diff));

    if (overflowing) {
        return (0, true)
    };

    let denominator = full_mul_u128(sqrt_price_0, sqrt_price_1);
    let quotient = div_round(numerator, denominator, round_up);

    ((quotient as u64), false)
}

public fun checked_shlw(n: u128): (u128, bool) {
    let mask = 0xffffffffu128 << HIGH_BITS_OFFSET;
    if (n > mask) {
        (0, true)
    } else {
        (n << SHIFT_BITS, false)
    }
}

public fun checked_shlw_strict(n: u128): (u128, bool) {
    let limit = 1u128 << HIGH_BITS_OFFSET;
    if (n >= limit) {
        (0, true)
    } else {
        (n << SHIFT_BITS, false)
    }
}

public fun div_round(numerator: u128, denominator: u128, round_up: bool): u128 {
    let quotient = numerator / denominator;
    let remainder = numerator % denominator;

    if (round_up && remainder > 0) {
        quotient + 1
    } else {
        quotient
    }
}

public fun abs_diff(a: u128, b: u128): u128 {
    if (a > b) {
        a - b
    } else {
        b - a
    }
}`,
      },
    ],
  },
  {
    id: "mailbox",
    difficulty: "medium",
    contractCode: `module move_over::mailbox;

use sui::dynamic_object_field as dof;
use move_over::mailbox_relay::{Self, RelayHandle};

const TARGET: u64 = 1_000_000;
const ADMIN: address = @0xAD3171;

const ENO_SUCH_LETTER: u64 = 0;
const ENOT_ENOUGH: u64 = 1;
const EWRONG_RECIPIENT: u64 = 2;

public struct PostOffice has key {
    id: UID,
    /// Publicly indexed: the id of the letter currently waiting inside.
    /// Mirrors what a Sui explorer or RPC would show for a parent's children.
    indexed: ID,
}

/// A \`Letter\` parked at the post office. The envelope records the intended
/// recipient; only the addressee should be able to receive it.
public struct Letter has key, store {
    id: UID,
    addressee: address,
    payload: u64,
}

public struct MailboxFlag has copy, drop {}

/// Setup: a juicy letter, addressed to the admin, is already waiting in the
/// office.
public fun open_office(ctx: &mut TxContext): PostOffice {
    let letter = Letter {
        id: object::new(ctx),
        addressee: ADMIN,
        payload: TARGET,
    };
    let letter_id = object::id(&letter.id);
    let mut office = PostOffice {
        id: object::new(ctx),
        indexed: letter_id,
    };
    dof::add(&mut office.id, letter_id, letter);
    office
}

/// Direct claim path: only the addressee themselves can pull their letter.
public fun claim(office: &mut PostOffice, letter_id: ID, ctx: &TxContext): Letter {
    assert!(dof::exists_(&office.id, letter_id), ENO_SUCH_LETTER);
    let letter = dof::remove<ID, Letter>(&mut office.id, letter_id);
    assert!(letter.addressee == tx_context::sender(ctx), EWRONG_RECIPIENT);
    letter
}

/// Delegated claim path. The protocol accepts a \`RelayHandle\` as proof of
/// recipient: it trusts the relay to have authenticated the holder off-chain
/// before issuing the handle. On-chain, we only need to check that the
/// envelope's addressee matches the handle's \`target\`.
public fun claim_via(
    office: &mut PostOffice,
    letter_id: ID,
    handle: &RelayHandle,
): Letter {
    assert!(dof::exists_(&office.id, letter_id), ENO_SUCH_LETTER);
    let letter = dof::remove<ID, Letter>(&mut office.id, letter_id);
    assert!(letter.addressee == mailbox_relay::target(handle), EWRONG_RECIPIENT);
    letter
}

/// What the explorer would tell you: the id of the next letter inside.
public fun next_letter(office: &PostOffice): ID {
    office.indexed
}

public fun payload(letter: &Letter): u64 {
    letter.payload
}

public fun addressee(letter: &Letter): address {
    letter.addressee
}

public fun close_office(office: PostOffice) {
    let PostOffice { id, indexed: _ } = office;
    id.delete();
}

/// Hand in the letter itself. \`Letter\` has no public constructor outside this
/// module, so the only way to satisfy this is to actually hold the envelope.
public fun solve(letter: Letter): MailboxFlag {
    let Letter { id, addressee: _, payload } = letter;
    id.delete();
    assert!(payload >= TARGET, ENOT_ENOUGH);
    MailboxFlag {}
}`,
    contractModules: [
      {
        module: "mailbox",
        contractCode: `module move_over::mailbox;

use sui::dynamic_object_field as dof;
use move_over::mailbox_relay::{Self, RelayHandle};

const TARGET: u64 = 1_000_000;
const ADMIN: address = @0xAD3171;

const ENO_SUCH_LETTER: u64 = 0;
const ENOT_ENOUGH: u64 = 1;
const EWRONG_RECIPIENT: u64 = 2;

public struct PostOffice has key {
    id: UID,
    /// Publicly indexed: the id of the letter currently waiting inside.
    /// Mirrors what a Sui explorer or RPC would show for a parent's children.
    indexed: ID,
}

/// A \`Letter\` parked at the post office. The envelope records the intended
/// recipient; only the addressee should be able to receive it.
public struct Letter has key, store {
    id: UID,
    addressee: address,
    payload: u64,
}

public struct MailboxFlag has copy, drop {}

/// Setup: a juicy letter, addressed to the admin, is already waiting in the
/// office.
public fun open_office(ctx: &mut TxContext): PostOffice {
    let letter = Letter {
        id: object::new(ctx),
        addressee: ADMIN,
        payload: TARGET,
    };
    let letter_id = object::id(&letter.id);
    let mut office = PostOffice {
        id: object::new(ctx),
        indexed: letter_id,
    };
    dof::add(&mut office.id, letter_id, letter);
    office
}

/// Direct claim path: only the addressee themselves can pull their letter.
public fun claim(office: &mut PostOffice, letter_id: ID, ctx: &TxContext): Letter {
    assert!(dof::exists_(&office.id, letter_id), ENO_SUCH_LETTER);
    let letter = dof::remove<ID, Letter>(&mut office.id, letter_id);
    assert!(letter.addressee == tx_context::sender(ctx), EWRONG_RECIPIENT);
    letter
}

/// Delegated claim path. The protocol accepts a \`RelayHandle\` as proof of
/// recipient: it trusts the relay to have authenticated the holder off-chain
/// before issuing the handle. On-chain, we only need to check that the
/// envelope's addressee matches the handle's \`target\`.
public fun claim_via(
    office: &mut PostOffice,
    letter_id: ID,
    handle: &RelayHandle,
): Letter {
    assert!(dof::exists_(&office.id, letter_id), ENO_SUCH_LETTER);
    let letter = dof::remove<ID, Letter>(&mut office.id, letter_id);
    assert!(letter.addressee == mailbox_relay::target(handle), EWRONG_RECIPIENT);
    letter
}

/// What the explorer would tell you: the id of the next letter inside.
public fun next_letter(office: &PostOffice): ID {
    office.indexed
}

public fun payload(letter: &Letter): u64 {
    letter.payload
}

public fun addressee(letter: &Letter): address {
    letter.addressee
}

public fun close_office(office: PostOffice) {
    let PostOffice { id, indexed: _ } = office;
    id.delete();
}

/// Hand in the letter itself. \`Letter\` has no public constructor outside this
/// module, so the only way to satisfy this is to actually hold the envelope.
public fun solve(letter: Letter): MailboxFlag {
    let Letter { id, addressee: _, payload } = letter;
    id.delete();
    assert!(payload >= TARGET, ENOT_ENOUGH);
    MailboxFlag {}
}`,
      },
      {
        module: "mailbox_relay",
        contractCode: `module move_over::mailbox_relay;

/// Proof-of-recipient issued by the relay. Holding a \`RelayHandle\` with
/// \`target = X\` is meant to certify that the relay has verified, off-chain,
/// that the holder is authorized to receive mail addressed to \`X\`.
///
/// The protocol (\`mailbox::claim_via\`) trusts that promise on-chain.
public struct RelayHandle has key, store {
    id: UID,
    target: address,
}

/// "Onboarding": the relay issues a handle for the supplied target address.
/// In production this is supposed to follow off-chain KYC of the requester.
/// On-chain, there is no constraint that ties \`target\` to the caller.
public fun handle_for(target: address, ctx: &mut TxContext): RelayHandle {
    RelayHandle {
        id: object::new(ctx),
        target,
    }
}

public fun target(handle: &RelayHandle): address {
    handle.target
}

public fun consume(handle: RelayHandle) {
    let RelayHandle { id, target: _ } = handle;
    id.delete();
}`,
      },
    ],
  },
];
