#[test_only]
module move_over::level_13_test;

use move_over::wrapper;
use move_over::level_13_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_13_solution::run(&mut t);
    assert!(wrapper::is_solved(&result), 0);
    wrapper::delete(result);
}
