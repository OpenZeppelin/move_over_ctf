module move_over::level_13_solution;

use move_over::wrapper;

public fun run(t: &mut tx_context::TxContext): wrapper::Vault {
    let mut v = wrapper::create_initial(t);
    wrapper::withdraw(&mut v, 500, t);
    wrapper::withdraw(&mut v, 500, t);
    v
}
