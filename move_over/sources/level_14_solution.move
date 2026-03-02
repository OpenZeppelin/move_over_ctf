module move_over::level_14_solution;

use move_over::ticket_stub;

public fun run(t: &mut tx_context::TxContext): ticket_stub::Vault {
    let v = ticket_stub::create_initial(t);
    v
}
