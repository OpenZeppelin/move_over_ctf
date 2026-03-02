module move_over::fallout;

struct Vault has key {
    id: UID,
    owner: address,
}

struct FalloutFlag has copy, drop {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let v = create_initial(ctx);
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        owner: @0x0,
    }
}

public fun get_owner(_vault: &Vault): address {
    @0x0
}

public fun withdraw(vault: Vault, _ctx: &mut tx_context::TxContext): FalloutFlag {
    let Vault { id, owner: _ } = vault;
    id.delete();
    FalloutFlag {}
}

