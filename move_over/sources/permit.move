module move_over::permit;

struct Permit has key { id: UID, nonce: u64, used: bool }
struct Treasury has key { id: UID, balance: u64 }
struct Solved has key, store {}

public entry fun create_user(ctx: &mut tx_context::TxContext) {
    let p = Permit { id: object::new(ctx), nonce: 0, used: false };
    transfer::transfer(p, tx_context::sender(ctx));
}

public entry fun create_treasury(ctx: &mut tx_context::TxContext) {
    let t = Treasury { id: object::new(ctx), balance: 1000 };
    transfer::transfer(t, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): (Permit, Treasury) {
    (
        Permit { id: object::new(ctx), nonce: 0, used: false },
        Treasury { id: object::new(ctx), balance: 1000 },
    )
}

public fun delete_treasury(t: Treasury) {
    let Treasury { id, balance: _ } = t;
    id.delete();
}

public fun delete_permit(p: Permit) {
    let Permit { id, nonce: _, used: _ } = p;
    id.delete();
}

public entry fun spend_with_permit(treasury: &mut Treasury, _permit: &Permit) {
    treasury.balance = 0;
}

public entry fun claim_solved(treasury: &Treasury, ctx: &mut tx_context::TxContext) {
    if (treasury.balance == 0) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
}

public fun is_solved(treasury: &Treasury): bool {
    treasury.balance == 0
}
