module move_over::open_gate;

struct Vault has key {
    id: UID,
    solved: bool,
}

struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let v = Vault { id: object::new(ctx), solved: false };
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        solved: false,
    }
}

public fun delete(v: Vault) {
    let Vault { id, solved: _ } = v;
    id.delete();
}

public entry fun set_solved_flag(v: &mut Vault, _ctx: &mut tx_context::TxContext) {
    v.solved = true;
}

public entry fun claim_solved(v: &Vault, ctx: &mut tx_context::TxContext) {
    assert!(v.solved, 1);
    transfer::transfer(Solved {}, tx_context::sender(ctx));
}

public fun is_solved(v: &Vault): bool {
    v.solved
}
