module move_over::level_9_solution;

use move_over::permit;

public fun run(t: &mut tx_context::TxContext): permit::Treasury {
    let (perm, mut treas) = permit::create_initial(t);
    permit::spend_with_permit(&mut treas, &perm);
    permit::delete_permit(perm);
    treas
}
