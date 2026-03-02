module move_over::price_feed;

struct Pool has key {
    id: UID,
    price: u64,
    reserves: u64,
    solved: bool,
}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let p = Pool {
        id: object::new(ctx),
        price: 100,
        reserves: 10000,
        solved: false,
    };
    transfer::transfer(p, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Pool {
    Pool {
        id: object::new(ctx),
        price: 100,
        reserves: 10000,
        solved: false,
    }
}

public fun delete(p: Pool) {
    let Pool { id, price: _, reserves: _, solved: _ } = p;
    id.delete();
}

public entry fun swap(pool: &mut Pool, amount_in: u64) {
    let out = amount_in * pool.price / 100;
    pool.reserves = pool.reserves - out;
    if (pool.reserves <= 0) {
        pool.solved = true;
    }
}

public entry fun set_price(pool: &mut Pool, new_price: u64) {
    pool.price = new_price;
}

public fun is_solved(pool: &Pool): bool {
    pool.solved
}
