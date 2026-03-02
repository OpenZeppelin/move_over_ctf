#[test_only]
module move_over::level_12_test;

use move_over::master_key;
use move_over::level_12_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_12_solution::run(&mut t);
    assert!(master_key::is_solved(&result), 0);
    master_key::delete_vault(result);
}
