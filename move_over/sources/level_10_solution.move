module move_over::level_10_solution;

use move_over::queue;

public fun run(t: &mut tx_context::TxContext): queue::Queue {
    let mut q = queue::create_initial(t);
    queue::enqueue(&mut q, t);
    queue::process(&mut q, t);
    q
}
