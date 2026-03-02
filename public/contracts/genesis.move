module move_over::genesis;

public struct Genesis has key {
    id: UID,
}

public struct GenesisFlag has copy, drop {}

public fun create(ctx: &mut tx_context::TxContext): Genesis {
    Genesis {
        id: object::new(ctx),
    }
}

public fun solve(flag: Genesis, number: u64): GenesisFlag {
    assert!(number == 1, 1);

    let Genesis { id } = flag;
    id.delete();
    GenesisFlag {}
}
