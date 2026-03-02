module move_over::wrapper;

struct Vault has key {
    id: UID,
    balance: u64,
}

struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let v = Vault { id: object::new(ctx), balance: 500 };
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        balance: 500,
    }
}

public fun delete(v: Vault) {
    let Vault { id, balance: _ } = v;
    id.delete();
}

public entry fun deposit(vault: &mut Vault, amount: u64) {
    vault.balance = vault.balance + amount;
}

public entry fun withdraw(vault: &mut Vault, amount: u64, ctx: &mut tx_context::TxContext) {
    assert!(vault.balance >= amount, 1);
    if (vault.balance - amount == 0) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
    vault.balance = vault.balance - amount;
}

public fun is_solved(vault: &Vault): bool {
    vault.balance == 0
}
