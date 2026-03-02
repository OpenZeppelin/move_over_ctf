module move_over::master_key;

struct AdminCap has key { id: UID }
struct Vault has key {
    id: UID,
    locked: bool,
    balance: u64,
}

struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let cap = AdminCap { id: object::new(ctx) };
    let vault = Vault {
        id: object::new(ctx),
        locked: true,
        balance: 500,
    };
    transfer::transfer(cap, tx_context::sender(ctx));
    transfer::transfer(vault, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): (AdminCap, Vault) {
    (
        AdminCap { id: object::new(ctx) },
        Vault {
            id: object::new(ctx),
            locked: true,
            balance: 500,
        },
    )
}

public fun delete_vault(v: Vault) {
    let Vault { id, locked: _, balance: _ } = v;
    id.delete();
}

public fun delete_cap(c: AdminCap) {
    let AdminCap { id } = c;
    id.delete();
}

public fun is_solved(v: &Vault): bool {
    !v.locked && v.balance == 0
}

public entry fun unlock_with_cap(_cap: &AdminCap, vault: &mut Vault) {
    vault.locked = false;
}

public entry fun transfer_cap(cap: AdminCap, to: address) {
    transfer::transfer(cap, to);
}

public entry fun drain(vault: &mut Vault, ctx: &mut tx_context::TxContext) {
    if (!vault.locked && vault.balance > 0) {
        vault.balance = 0;
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
}
