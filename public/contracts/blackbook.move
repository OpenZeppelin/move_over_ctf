module move_over::blackbook;

use move_over::blackbook_math;

const EINSUFFICIENT_MARGIN: u64 = 0;
const EMULTIPLICATION_OVERFLOW: u64 = 1;
const EINSUFFICIENT_RESERVE: u64 = 2;
const EINSUFFICIENT_VALUE: u64 = 3;
const EZERO_LIQUIDITY: u64 = 4;
const EINVALID_MARGIN_NOTE: u64 = 5;

const INITIAL_RESERVE: u64 = 25_000_000;
const TARGET_VALUE: u64 = 10_000_000;
const PAYOUT_SHIFT: u8 = 28;

public struct Ledger has key {
    id: UID,
    reserve: u64,
    epoch: u64,
}

public struct MarginNote has key, store {
    id: UID,
    value: u64,
}

public struct Position has key, store {
    id: UID,
    liquidity: u128,
    margin_paid: u64,
    epoch: u64,
}

public struct BlackbookFlag has copy, drop {}

fun root_price_0(): u128 {
    1u128 << 60
}

fun root_price_1(): u128 {
    (1u128 << 60) + (1u128 << 44) + 17u128
}

public fun bootstrap(ctx: &mut TxContext): Ledger {
    Ledger {
        id: object::new(ctx),
        reserve: INITIAL_RESERVE,
        epoch: 0,
    }
}

public fun faucet(ctx: &mut TxContext): MarginNote {
    MarginNote {
        id: object::new(ctx),
        value: 1,
    }
}

public fun open_position(
    ledger: &mut Ledger,
    payment: MarginNote,
    liquidity: u128,
    ctx: &mut TxContext,
): Position {
    assert!(liquidity > 0, EZERO_LIQUIDITY);

    let required = required_margin(liquidity);
    let MarginNote {
        id: payment_id,
        value,
    } = payment;
    assert!(value == 1, EINVALID_MARGIN_NOTE);
    assert!(value >= required, EINSUFFICIENT_MARGIN);
    payment_id.delete();

    ledger.reserve = ledger.reserve + required;
    let position = Position {
        id: object::new(ctx),
        liquidity,
        margin_paid: required,
        epoch: ledger.epoch,
    };
    ledger.epoch = ledger.epoch + 1;
    position
}

public fun close_position(ledger: &mut Ledger, position: Position, ctx: &mut TxContext): MarginNote {
    let Position {
        id,
        liquidity,
        margin_paid: _,
        epoch: _,
    } = position;
    id.delete();

    let payout = blackbook_math::payout_from_liquidity(liquidity, PAYOUT_SHIFT);
    assert!(ledger.reserve >= payout, EINSUFFICIENT_RESERVE);
    ledger.reserve = ledger.reserve - payout;

    MarginNote {
        id: object::new(ctx),
        value: payout,
    }
}

public fun solve(note: MarginNote): BlackbookFlag {
    let MarginNote { id, value } = note;
    assert!(value >= TARGET_VALUE, EINSUFFICIENT_VALUE);
    id.delete();
    BlackbookFlag {}
}

public fun discard_ledger(ledger: Ledger) {
    let Ledger {
        id,
        reserve: _,
        epoch: _,
    } = ledger;
    id.delete();
}

public fun value(note: &MarginNote): u64 {
    note.value
}

fun required_margin(liquidity: u128): u64 {
    let (required, overflowing) =
        blackbook_math::quote_required_margin(root_price_0(), root_price_1(), liquidity, true);
    if (overflowing) {
        abort EMULTIPLICATION_OVERFLOW
    };
    required
}
