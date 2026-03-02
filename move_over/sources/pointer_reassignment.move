module move_over::pointer_reassignment;

struct Treasury has key {
    id: UID,
    limit: u64,
    left: u64,
}

struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let t = Treasury {
        id: object::new(ctx),
        limit: 1000,
        left: 1000,
    };
    transfer::transfer(t, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Treasury {
    Treasury {
        id: object::new(ctx),
        limit: 1000,
        left: 1000,
    }
}

public fun delete(t: Treasury) {
    let Treasury { id, limit: _, left: _ } = t;
    id.delete();
}

public entry fun reset_and_mint(t: &mut Treasury, amount: u64, ctx: &mut tx_context::TxContext) {
    let left = &mut t.left;
    let limit = &mut t.limit;
    left = limit;
    assert!(*left >= amount, 1);
    *left = *left - amount;
    if (t.limit == 0) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
}

public fun is_solved(t: &Treasury): bool {
    t.limit == 0
}
