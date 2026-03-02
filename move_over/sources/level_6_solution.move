module move_over::level_6_solution;

use move_over::truncation;

public fun run(t: &mut tx_context::TxContext): truncation::TruncationState {
    let mut s = truncation::create_initial(t);
    truncation::withdraw(&mut s.pool, &mut s.user, t);
    s
}
