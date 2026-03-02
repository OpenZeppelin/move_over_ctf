module move_over::level_7_solution;

use move_over::split_ledger;

public fun run(t: &mut tx_context::TxContext): split_ledger::SplitLedgerState {
    let mut s = split_ledger::create_initial(t);
    split_ledger::mint(&mut s.wallet, &s.registry);
    split_ledger::burn(&mut s.wallet, &mut s.registry);
    s
}
