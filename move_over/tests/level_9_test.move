#[test_only]
module move_over::level_9_test;

use move_over::permit;
use move_over::level_9_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_9_solution::run(&mut t);
    assert!(permit::is_solved(&result), 0);
    permit::delete_treasury(result);
}
