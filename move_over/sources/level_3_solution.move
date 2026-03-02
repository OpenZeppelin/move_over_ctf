module move_over::level_3_solution;

use move_over::blank_check;

public fun run(t: &mut tx_context::TxContext): blank_check::Balance {
    let mut b = blank_check::create_initial(t);
    blank_check::transfer(&mut b, 100, t);
    b
}
