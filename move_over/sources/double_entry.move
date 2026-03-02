module move_over::double_entry;

struct Ledger has key {
    id: UID,
    total: u64,
    my_balance: u64,
}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let l = Ledger {
        id: object::new(ctx),
        total: 200,
        my_balance: 200,
    };
    transfer::transfer(l, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Ledger {
    Ledger {
        id: object::new(ctx),
        total: 200,
        my_balance: 200,
    }
}

public fun delete(l: Ledger) {
    let Ledger { id, total: _, my_balance: _ } = l;
    id.delete();
}

public entry fun withdraw(ledger: &mut Ledger, amount: u64) {
    assert!(ledger.my_balance >= amount, 1);
    ledger.total = ledger.total - amount;
    ledger.my_balance = ledger.my_balance - amount;
}

public fun is_solved(ledger: &Ledger): bool {
    ledger.total == 0 && ledger.my_balance > 0
}
