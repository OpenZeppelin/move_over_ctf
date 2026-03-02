module move_over::fallout;

struct Vault has key {
    id: UID,
    owner: address,
    balance: u64,
}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let v = Vault {
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        balance: 999,
    };
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        owner: @0x0,
        balance: 999,
    }
}

public fun delete(v: Vault) {
    let Vault { id, owner: _, balance: _ } = v;
    id.delete();
}

public fun get_owner(_vault: &Vault): address {
    @0x0
}

public entry fun withdraw(vault: &mut Vault, ctx: &mut tx_context::TxContext) {
    if (tx_context::sender(ctx) == get_owner(vault) && vault.balance > 0) {
        vault.balance = 0;
    }
}

public fun is_solved(vault: &Vault): bool {
    vault.balance == 0
}
