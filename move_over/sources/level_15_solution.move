module move_over::level_15_solution;

use move_over::pointer_reassignment;

public fun run(t: &mut tx_context::TxContext): pointer_reassignment::Treasury {
    let mut tr = pointer_reassignment::create_initial(t);
    pointer_reassignment::reset_and_mint(&mut tr, 1000, t);
    tr
}
