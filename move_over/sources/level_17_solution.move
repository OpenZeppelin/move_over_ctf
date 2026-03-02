module move_over::level_17_solution;

use move_over::open_gate;

public fun run(t: &mut tx_context::TxContext): open_gate::Vault {
    let mut v = open_gate::create_initial(t);
    open_gate::set_solved_flag(&mut v, t);
    v
}
