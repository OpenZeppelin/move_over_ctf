module move_over::lockbox;

struct Lockbox has key {
    id: UID,
    locked: bool,
    password: vector<u8>,
    balance: u64,
}

public entry fun create(password: vector<u8>, ctx: &mut tx_context::TxContext) {
    let v = Lockbox {
        id: object::new(ctx),
        locked: true,
        password,
        balance: 1000,
    };
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Lockbox {
    Lockbox {
        id: object::new(ctx),
        locked: true,
        password: b"secret",
        balance: 1000,
    }
}

public fun delete(v: Lockbox) {
    let Lockbox { id, locked: _, password: _, balance: _ } = v;
    id.delete();
}

public fun get_password(vault: &Lockbox): vector<u8> {
    *&vault.password
}

public entry fun unlock(vault: &mut Lockbox, provided: vector<u8>) {
    if (vault.locked && vault.password == provided) {
        vault.locked = false;
    }
}

public entry fun drain(vault: &mut Lockbox, ctx: &mut tx_context::TxContext) {
    assert!(!vault.locked, 1);
    vault.balance = 0;
}

public fun is_solved(vault: &Lockbox): bool {
    !vault.locked && vault.balance == 0
}
