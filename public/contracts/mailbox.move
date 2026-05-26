module move_over::mailbox;

use sui::dynamic_object_field as dof;
use move_over::mailbox_relay::{Self, RelayHandle};

const TARGET: u64 = 1_000_000;
const ADMIN: address = @0xAD3171;

const ENO_SUCH_LETTER: u64 = 0;
const ENOT_ENOUGH: u64 = 1;
const EWRONG_RECIPIENT: u64 = 2;

public struct PostOffice has key {
    id: UID,
    /// Publicly indexed: the id of the letter currently waiting inside.
    /// Mirrors what a Sui explorer or RPC would show for a parent's children.
    indexed: ID,
}

/// A `Letter` parked at the post office. The envelope records the intended
/// recipient; only the addressee should be able to receive it.
public struct Letter has key, store {
    id: UID,
    addressee: address,
    payload: u64,
}

public struct MailboxFlag has copy, drop {}

/// Setup: a juicy letter, addressed to the admin, is already waiting in the
/// office.
public fun open_office(ctx: &mut TxContext): PostOffice {
    let letter = Letter {
        id: object::new(ctx),
        addressee: ADMIN,
        payload: TARGET,
    };
    let letter_id = object::id(&letter.id);
    let mut office = PostOffice {
        id: object::new(ctx),
        indexed: letter_id,
    };
    dof::add(&mut office.id, letter_id, letter);
    office
}

/// Direct claim path: only the addressee themselves can pull their letter.
public fun claim(office: &mut PostOffice, letter_id: ID, ctx: &TxContext): Letter {
    assert!(dof::exists_(&office.id, letter_id), ENO_SUCH_LETTER);
    let letter = dof::remove<ID, Letter>(&mut office.id, letter_id);
    assert!(letter.addressee == tx_context::sender(ctx), EWRONG_RECIPIENT);
    letter
}

/// Delegated claim path. The protocol accepts a `RelayHandle` as proof of
/// recipient: it trusts the relay to have authenticated the holder off-chain
/// before issuing the handle. On-chain, we only need to check that the
/// envelope's addressee matches the handle's `target`.
public fun claim_via(
    office: &mut PostOffice,
    letter_id: ID,
    handle: &RelayHandle,
): Letter {
    assert!(dof::exists_(&office.id, letter_id), ENO_SUCH_LETTER);
    let letter = dof::remove<ID, Letter>(&mut office.id, letter_id);
    assert!(letter.addressee == mailbox_relay::target(handle), EWRONG_RECIPIENT);
    letter
}

/// What the explorer would tell you: the id of the next letter inside.
public fun next_letter(office: &PostOffice): ID {
    office.indexed
}

public fun payload(letter: &Letter): u64 {
    letter.payload
}

public fun addressee(letter: &Letter): address {
    letter.addressee
}

public fun close_office(office: PostOffice) {
    let PostOffice { id, indexed: _ } = office;
    id.delete();
}

/// Hand in the letter itself. `Letter` has no public constructor outside this
/// module, so the only way to satisfy this is to actually hold the envelope.
public fun solve(letter: Letter): MailboxFlag {
    let Letter { id, addressee: _, payload } = letter;
    id.delete();
    assert!(payload >= TARGET, ENOT_ENOUGH);
    MailboxFlag {}
}
