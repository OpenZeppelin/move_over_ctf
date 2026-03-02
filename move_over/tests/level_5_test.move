#[test_only]
module move_over::level_5_test;

use move_over::double_entry;
use move_over::level_5_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_5_solution::run(&mut t);
    assert!(double_entry::is_solved(&result), 0);
    double_entry::delete(result);
}
