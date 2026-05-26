module move_over::mailbox_relay;

/// Proof-of-recipient issued by the relay. Holding a `RelayHandle` with
/// `target = X` is meant to certify that the relay has verified, off-chain,
/// that the holder is authorized to receive mail addressed to `X`.
///
/// The protocol (`mailbox::claim_via`) trusts that promise on-chain.
public struct RelayHandle has key, store {
    id: UID,
    target: address,
}

/// "Onboarding": the relay issues a handle for the supplied target address.
/// In production this is supposed to follow off-chain KYC of the requester.
/// On-chain, there is no constraint that ties `target` to the caller.
public fun handle_for(target: address, ctx: &mut TxContext): RelayHandle {
    RelayHandle {
        id: object::new(ctx),
        target,
    }
}

public fun target(handle: &RelayHandle): address {
    handle.target
}

public fun consume(handle: RelayHandle) {
    let RelayHandle { id, target: _ } = handle;
    id.delete();
}
