module move_over::sticky_treasure_dof;

use sui::dynamic_object_field as dof;

public struct Chest has key {
    id: UID,
}

/// Key for the dynamic object field (struct key instead of a bare byte string).
public struct PrizeKey has copy, drop, store {
    name: vector<u8>,
}

public struct Prize has key, store {
    id: UID,
    value: u64,
}

public struct ObjectChestFlag has copy, drop {}

fun prize_key(): PrizeKey {
    PrizeKey { name: b"prize" }
}

public fun create(ctx: &mut TxContext): Chest {
    let mut chest = Chest { id: object::new(ctx) };
    let prize = Prize { id: object::new(ctx), value: 2000 };
    dof::add(&mut chest.id, prize_key(), prize);
    chest
}

public fun smash(chest: Chest, ctx: &mut TxContext): Prize {
    let Chest { id } = chest;
    id.delete();
    Prize { id: object::new(ctx), value: 0 }
}

public fun has_prize(chest: &Chest): bool {
    dof::exists_(&chest.id, prize_key())
}

public fun extract_prize(chest: &mut Chest): Prize {
    dof::remove(&mut chest.id, prize_key())
}

public fun discard(chest: Chest) {
    let Chest { id } = chest;
    id.delete();
}

public fun solve(prize: Prize): ObjectChestFlag {
    assert!(prize.value == 2000, 0);
    let Prize { id, value: _ } = prize;
    id.delete();
    ObjectChestFlag {}
}
