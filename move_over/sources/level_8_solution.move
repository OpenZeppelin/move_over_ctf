module move_over::level_8_solution;

use move_over::jackpot;

public fun run(t: &mut tx_context::TxContext): jackpot::Pool {
    let mut p = jackpot::create_initial(t);
    jackpot::deposit(&mut p, 100);
    jackpot::claim(&mut p, t);
    p
}
