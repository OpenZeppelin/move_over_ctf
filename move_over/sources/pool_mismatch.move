module move_over::pool_mismatch;

struct Pool has key {
    id: UID,
    balance: u64,
}

struct Solved has key, store {}

public entry fun create_vault(ctx: &mut tx_context::TxContext) {
    let p = Pool { id: object::new(ctx), balance: 1000 };
    transfer::transfer(p, tx_context::sender(ctx));
}

public entry fun create_pool(ctx: &mut tx_context::TxContext) {
    let p = Pool { id: object::new(ctx), balance: 0 };
    transfer::transfer(p, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Pool {
    Pool {
        id: object::new(ctx),
        balance: 1000,
    }
}

public fun delete(p: Pool) {
    let Pool { id, balance: _ } = p;
    id.delete();
}

public entry fun withdraw(
    pool: &mut Pool,
    _claimed_pool_id: address,
    amount: u64,
    ctx: &mut tx_context::TxContext
) {
    assert!(pool.balance >= amount, 1);
    pool.balance = pool.balance - amount;
    if (pool.balance == 0) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
}

public fun is_solved(pool: &Pool): bool {
    pool.balance == 0
}
