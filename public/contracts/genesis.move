module move_over::genesis;

public struct Genesis has key {
    id: UID,
    value: u64,
}

public struct GenesisFlag has copy, drop {}

public fun create(number: u64, ctx: &mut tx_context::TxContext): Genesis {
    Genesis {
        id: object::new(ctx),
        value: number,
    }
}

public fun solve(flag: Genesis): GenesisFlag {
    let Genesis { id, value } = flag;
    assert!(value == 2, 1);

    id.delete();
    GenesisFlag {}
}
