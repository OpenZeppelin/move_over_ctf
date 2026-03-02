module move_over::level_1_solution;

use move_over::lockbox;

public fun run(t: &mut tx_context::TxContext): lockbox::Lockbox {
    let mut v = lockbox::create_initial(t);
    lockbox::unlock(&mut v, lockbox::get_password(&v));
    lockbox::drain(&mut v, t);
    v
}
