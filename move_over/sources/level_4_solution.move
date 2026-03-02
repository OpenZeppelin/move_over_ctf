module move_over::level_4_solution;

use move_over::open_door;

public fun run(t: &mut tx_context::TxContext): open_door::Config {
    let mut c = open_door::create_initial(t);
    open_door::set_flag(&mut c);
    c
}
