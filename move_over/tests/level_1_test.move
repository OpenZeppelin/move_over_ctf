#[test_only]
module move_over::level_1_test;

use move_over::lockbox;
use move_over::level_1_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_1_solution::run(&mut t);
    assert!(lockbox::is_solved(&result), 0);
    lockbox::delete(result);
}
