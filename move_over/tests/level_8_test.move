#[test_only]
module move_over::level_8_test;

use move_over::jackpot;
use move_over::level_8_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_8_solution::run(&mut t);
    assert!(jackpot::is_solved(&result), 0);
    jackpot::delete(result);
}
