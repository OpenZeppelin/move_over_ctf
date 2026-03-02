#[test_only]
module move_over::level_18_test;

use move_over::wrong_repay;
use move_over::level_18_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_18_solution::run(&mut t);
    assert!(wrong_repay::is_solved(&result), 0);
    wrong_repay::delete(result);
}
