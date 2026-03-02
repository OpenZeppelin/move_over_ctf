module move_over::level_5_solution;

use move_over::double_entry;

public fun run(t: &mut tx_context::TxContext): double_entry::Ledger {
    let mut l = double_entry::create_initial(t);
    double_entry::withdraw(&mut l, 200);
    l
}
