module move_over::ticket_stub;

struct Vault has key {
    id: UID,
    balance: u64,
}

struct Receipt has key, store { id: UID, amount: u64 }
struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let v = Vault { id: object::new(ctx), balance: 1000 };
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        balance: 1000,
    }
}

public fun delete(v: Vault) {
    let Vault { id, balance: _ } = v;
    id.delete();
}

public fun is_solved(vault: &Vault): bool {
    vault.balance >= 1000
}

public entry fun deposit(vault: &mut Vault, amount: u64, ctx: &mut tx_context::TxContext) {
    assert!(vault.balance >= amount, 1);
    vault.balance = vault.balance - amount;
    let r = Receipt { id: object::new(ctx), amount };
    transfer::transfer(r, tx_context::sender(ctx));
}

public entry fun withdraw(vault: &mut Vault, receipt: &Receipt, ctx: &mut tx_context::TxContext) {
    vault.balance = vault.balance + receipt.amount;
    if (vault.balance >= 1000) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
}
