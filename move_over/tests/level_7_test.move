#[test_only]
module move_over::level_7_test;

use move_over::split_ledger;
use move_over::level_7_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_7_solution::run(&mut t);
    assert!(split_ledger::is_solved(&result), 0);
    split_ledger::delete(result);
}
