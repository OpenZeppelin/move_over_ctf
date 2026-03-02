#[test_only]
module move_over::level_10_test;

use move_over::queue;
use move_over::level_10_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_10_solution::run(&mut t);
    assert!(queue::is_solved(&result), 0);
    queue::delete(result);
}
