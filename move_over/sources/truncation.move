module move_over::truncation;

struct Pool has key {
    id: UID,
    total_deposits: u64,
    fee_accumulated: u64,
    shares: u64,
}

struct User has key {
    id: UID,
    shares: u64,
}

/// Wrapper for test: hold pool + user so solution can call withdraw and return state.
public struct TruncationState has key {
    pub pool: Pool,
    pub user: User,
}

struct Solved has key, store {}

const FEE_BPS: u64 = 300;

public entry fun create_pool(ctx: &mut tx_context::TxContext) {
    let p = Pool {
        id: object::new(ctx),
        total_deposits: 0,
        fee_accumulated: 0,
        shares: 0,
    };
    transfer::transfer(p, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): TruncationState {
    TruncationState {
        pool: Pool {
            id: object::new(ctx),
            total_deposits: 10000,
            fee_accumulated: 300,
            shares: 10000,
        },
        user: User {
            id: object::new(ctx),
            shares: 10000,
        },
    }
}

public fun delete(s: TruncationState) {
    let TruncationState { pool, user } = s;
    let Pool { id: pid, total_deposits: _, fee_accumulated: _, shares: _ } = pool;
    let User { id: uid, shares: _ } = user;
    pid.delete();
    uid.delete();
}

public fun is_solved(s: &TruncationState): bool {
    s.pool.fee_accumulated == 0 && s.pool.total_deposits > 0
}

public entry fun deposit(pool: &mut Pool, amount: u64, ctx: &mut tx_context::TxContext) {
    let fee = amount * FEE_BPS / 10000;
    pool.total_deposits = pool.total_deposits + amount;
    pool.fee_accumulated = pool.fee_accumulated + fee;
    pool.shares = pool.shares + (amount - fee);
    let u = User { id: object::new(ctx), shares: amount - fee };
    transfer::transfer(u, tx_context::sender(ctx));
}

public entry fun withdraw(pool: &mut Pool, user: &mut User, ctx: &mut tx_context::TxContext) {
    let share = user.shares;
    let fee = share * FEE_BPS / 10000;
    pool.shares = pool.shares - share;
    pool.fee_accumulated = pool.fee_accumulated - fee;
    user.shares = 0;
    if (pool.fee_accumulated == 0 && pool.total_deposits > 0) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
}
