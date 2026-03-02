module move_over::jackpot;

struct Pool has key {
    id: UID,
    deposited: u64,
    claimed: u64,
}

struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let p = Pool { id: object::new(ctx), deposited: 0, claimed: 0 };
    transfer::transfer(p, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Pool {
    Pool {
        id: object::new(ctx),
        deposited: 100,
        claimed: 0,
    }
}

public fun delete(p: Pool) {
    let Pool { id, deposited: _, claimed: _ } = p;
    id.delete();
}

public fun is_solved(pool: &Pool): bool {
    pool.deposited > 0 && pool.claimed >= pool.deposited
}

public entry fun deposit(pool: &mut Pool, amount: u64) {
    pool.deposited = pool.deposited + amount;
}

public entry fun claim(pool: &mut Pool, ctx: &mut tx_context::TxContext) {
    if (pool.deposited > 0 && pool.claimed < pool.deposited) {
        pool.claimed = pool.claimed + 100;
        if (pool.claimed >= pool.deposited) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }
}
