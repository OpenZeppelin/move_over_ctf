module move_over::blank_check;

struct Balance has key {
    id: UID,
    value: u64,
}

struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let b = Balance {
        id: object::new(ctx),
        value: 100,
    };
    transfer::transfer(b, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Balance {
    Balance {
        id: object::new(ctx),
        value: 100,
    }
}

public fun delete(b: Balance) {
    let Balance { id, value: _ } = b;
    id.delete();
}

public entry fun transfer(bal: &mut Balance, amount: u64, ctx: &mut tx_context::TxContext) {
    bal.value = bal.value - amount;
    if (bal.value == 0) {
        let solved = Solved {};
        transfer::transfer(solved, tx_context::sender(ctx));
    }
}

public fun is_solved(bal: &Balance): bool {
    bal.value == 0
}
