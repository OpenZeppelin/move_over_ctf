#[test_only]
module move_over::level_3_test;

use move_over::blank_check;
use move_over::level_3_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_3_solution::run(&mut t);
    assert!(blank_check::is_solved(&result), 0);
    blank_check::delete(result);
}
