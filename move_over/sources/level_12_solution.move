module move_over::level_12_solution;

use move_over::master_key;

public fun run(t: &mut tx_context::TxContext): master_key::Vault {
    let (cap, mut vault) = master_key::create_initial(t);
    master_key::unlock_with_cap(&cap, &mut vault);
    master_key::drain(&mut vault, t);
    master_key::delete_cap(cap);
    vault
}
