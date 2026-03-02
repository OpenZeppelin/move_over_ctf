module move_over::genesis;

public struct Genesis has key {
    id: UID,
    solved: bool,
}

public fun create(ctx: &mut tx_context::TxContext): Genesis {
    let obj = Genesis {
        id: object::new(ctx),
        solved: false,
    };
    obj
}

public fun delete(flag: Genesis) {
    let Genesis { id, solved: _ } = flag;
    id.delete();
}

public fun solve(flag: &mut Genesis) {
    flag.solved = true;
}

public fun is_solved(flag: &Genesis): bool {
    flag.solved
}
