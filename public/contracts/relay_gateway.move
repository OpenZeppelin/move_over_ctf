module move_over::relay_gateway;

use move_over::relay_core;

public struct RelayVault has key {
    id: UID,
}

public struct RelayFlag has copy, drop {}

public fun create(ctx: &mut tx_context::TxContext): RelayVault {
    RelayVault {
        id: object::new(ctx),
    }
}

public fun open(vault: RelayVault, pin: u64): RelayFlag {
    let _permit = relay_core::issue_permit(pin);
    let RelayVault { id } = vault;
    id.delete();
    RelayFlag {}
}
