#[test_only]
module move_over::level_0_test;

use move_over::genesis;
use move_over::level_0_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let flag = level_0_solution::run(&mut t);
    assert!(genesis::is_solved(&flag), 0);
    genesis::delete(flag);
}
