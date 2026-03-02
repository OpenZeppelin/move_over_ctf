#[test_only]
module move_over::level_15_test;

use move_over::pointer_reassignment;
use move_over::level_15_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_15_solution::run(&mut t);
    assert!(pointer_reassignment::is_solved(&result), 0);
    pointer_reassignment::delete(result);
}
