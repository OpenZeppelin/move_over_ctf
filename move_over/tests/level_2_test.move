#[test_only]
module move_over::level_2_test;

use move_over::fallout;
use move_over::level_2_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_2_solution::run(&mut t);
    assert!(fallout::is_solved(&result), 0);
    fallout::delete(result);
}
