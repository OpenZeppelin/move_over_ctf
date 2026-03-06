module move_over::sticky_treasure;

use sui::dynamic_field as df;

public struct Chest has key {
    id: UID,
}

public struct Prize has store, copy, drop {
    value: u64,
}

public struct StickyTreasureFlag has copy, drop {}

public fun create(ctx: &mut TxContext): Chest {
    let mut chest = Chest { id: object::new(ctx) };
    df::add(&mut chest.id, b"prize", Prize { value: 1000 });
    chest
}

public fun smash(chest: Chest): Prize {
    let Chest { id } = chest;
    id.delete();
    Prize { value: 0 }
}

public fun has_prize(chest: &Chest): bool {
    df::exists_(&chest.id, b"prize")
}

public fun extract_prize(chest: &mut Chest): Prize {
    df::remove(&mut chest.id, b"prize")
}

public fun discard(chest: Chest) {
    let Chest { id } = chest;
    id.delete();
}

public fun solve(prize: Prize): StickyTreasureFlag {
    assert!(prize.value == 1000, 0);
    StickyTreasureFlag {}
}
