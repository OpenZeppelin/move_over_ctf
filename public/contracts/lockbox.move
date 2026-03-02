module move_over::lockbox;

struct Lockbox has key {
    id: UID,
    password: vector<u8>,
}

struct UnlockTicket has copy, drop {}

struct LockboxFlag has copy, drop {}

public fun create(password: vector<u8>, ctx: &mut tx_context::TxContext): Lockbox {
    Lockbox {
        id: object::new(ctx),
        password,
    }
}

public fun delete(vault: Lockbox) {
    let Lockbox { id, password: _ } = vault;
    id.delete();
}

public fun get_password(vault: &Lockbox): vector<u8> {
    *&vault.password
}

public fun unlock(_vault: &Lockbox, _provided: vector<u8>): UnlockTicket {
    UnlockTicket {}
}

public fun drain(
    vault: Lockbox,
    _ticket: UnlockTicket,
    _ctx: &mut tx_context::TxContext,
): LockboxFlag {
    let Lockbox { id, password: _ } = vault;
    id.delete();
    LockboxFlag {}
}

