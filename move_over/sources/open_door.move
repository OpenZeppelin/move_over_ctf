module move_over::open_door;

struct Config has key {
    id: UID,
    admin: address,
    flag: bool,
}

struct Solved has key, store {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let c = Config {
        id: object::new(ctx),
        admin: tx_context::sender(ctx),
        flag: false,
    };
    transfer::transfer(c, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Config {
    Config {
        id: object::new(ctx),
        admin: tx_context::sender(ctx),
        flag: false,
    }
}

public fun delete(c: Config) {
    let Config { id, admin: _, flag: _ } = c;
    id.delete();
}

public fun is_solved(c: &Config): bool {
    c.flag
}

public entry fun set_flag(c: &mut Config) {
    c.flag = true;
}

public entry fun claim_solved(c: &Config, ctx: &mut tx_context::TxContext) {
    if (c.flag) {
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }
}
