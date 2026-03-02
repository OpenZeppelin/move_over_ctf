#[test_only]
module move_over::level_6_test;

use move_over::truncation;
use move_over::level_6_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_6_solution::run(&mut t);
    assert!(truncation::is_solved(&result), 0);
    truncation::delete(result);
}
