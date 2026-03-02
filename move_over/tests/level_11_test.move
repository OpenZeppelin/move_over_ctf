#[test_only]
module move_over::level_11_test;

use move_over::price_feed;
use move_over::level_11_solution;

#[test]
fun test_solution() {
    let mut t = sui::tx_context::dummy();
    let result = level_11_solution::run(&mut t);
    assert!(price_feed::is_solved(&result), 0);
    price_feed::delete(result);
}
