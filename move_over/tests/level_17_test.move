#[test_only]
module move_over::level_17_test;

use move_over::open_gate;
use move_over::level_17_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_17_solution::run(&mut t);
    assert!(open_gate::is_solved(&result), 0);
    open_gate::delete(result);
}
