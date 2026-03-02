#[test_only]
module move_over::level_4_test;

use move_over::open_door;
use move_over::level_4_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_4_solution::run(&mut t);
    assert!(open_door::is_solved(&result), 0);
    open_door::delete(result);
}
