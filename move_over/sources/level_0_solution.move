module move_over::level_0_solution;

use move_over::genesis;

public fun run(t: &mut tx_context::TxContext): genesis::Genesis {
    let mut flag = genesis::create(t);
    genesis::solve(&mut flag);
    flag
}
