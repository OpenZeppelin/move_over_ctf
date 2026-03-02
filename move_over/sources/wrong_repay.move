module move_over::wrong_repay;

struct Pool has key {
    id: UID,
    balance: u64,
}

struct Receipt has key {
    id: UID,
    pool_id: object::ID,
    amount: u64,
}

struct Solved has key, store {}

public entry fun create_victim(ctx: &mut tx_context::TxContext) {
    let p = Pool { id: object::new(ctx), balance: 1000 };
    transfer::transfer(p, tx_context::sender(ctx));
}

public entry fun create_attacker(ctx: &mut tx_context::TxContext) {
    let p = Pool { id: object::new(ctx), balance: 0 };
    transfer::transfer(p, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): (Pool, Pool) {
    (
        Pool { id: object::new(ctx), balance: 1000 },
        Pool { id: object::new(ctx), balance: 0 },
    )
}

public fun create_initial_with_receipt(ctx: &mut tx_context::TxContext): (Pool, Pool, Receipt) {
    let victim = Pool { id: object::new(ctx), balance: 1000 };
    let victim_id = object::id(&victim);
    let attacker = Pool { id: object::new(ctx), balance: 0 };
    let receipt = Receipt {
        id: object::new(ctx),
        pool_id: victim_id,
        amount: 1000,
    };
    (victim, attacker, receipt)
}

public fun delete(p: Pool) {
    let Pool { id, balance: _ } = p;
    id.delete();
}

public fun is_solved(pool: &Pool): bool {
    pool.balance >= 1000
}

public entry fun borrow(pool: &mut Pool, amount: u64, ctx: &mut tx_context::TxContext) {
    assert!(pool.balance >= amount, 1);
    pool.balance = pool.balance - amount;
    let r = Receipt {
        id: object::new(ctx),
        pool_id: object::id(pool),
        amount,
    };
    transfer::transfer(r, tx_context::sender(ctx));
}

public entry fun repay(
    pool: &mut Pool,
    receipt: Receipt,
    ctx: &mut tx_context::TxContext
) {
    pool.balance = pool.balance + receipt.amount;
    if (pool.balance >= 1000) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
    let Receipt { id, pool_id: _, amount: _ } = receipt;
    id.delete();
}
