#[test_only]
module move_over::level_16_test;

use move_over::pool_mismatch;
use move_over::level_16_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_16_solution::run(&mut t);
    assert!(pool_mismatch::is_solved(&result), 0);
    pool_mismatch::delete(result);
}
