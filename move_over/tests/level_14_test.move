#[test_only]
module move_over::level_14_test;

use move_over::ticket_stub;
use move_over::level_14_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_14_solution::run(&mut t);
    assert!(ticket_stub::is_solved(&result), 0);
    ticket_stub::delete(result);
}
