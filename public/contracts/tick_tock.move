module move_over::tick_tock;

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
}
