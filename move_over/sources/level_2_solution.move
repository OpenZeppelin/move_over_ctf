module move_over::level_2_solution;

use move_over::fallout;

public fun run(t: &mut tx_context::TxContext): fallout::Vault {
    let mut v = fallout::create_initial(t);
    fallout::withdraw(&mut v, t);
    v
}
