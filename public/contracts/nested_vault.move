module move_over::nested_vault;

public struct LevelThreeCore has key, store {
    id: UID,
    charge: u64,
    mode: u64,
}

public struct LevelTwoWrap has store {
    level_three: LevelThreeCore,
}

public struct LevelOneWrap has store {
    level_two: LevelTwoWrap,
}

public struct NestedVault has key {
    id: UID,
    level_one: LevelOneWrap,
}

public struct NestedVaultFlag has copy, drop {}

public fun spawn(ctx: &mut tx_context::TxContext): NestedVault {
    let level_three = LevelThreeCore {
        id: object::new(ctx),
        charge: 0,
        mode: 0,
    };
    let level_two = LevelTwoWrap { level_three };
    let level_one = LevelOneWrap { level_two };
    NestedVault {
        id: object::new(ctx),
        level_one,
    }
}

public fun set_charge(vault: &mut NestedVault, amount: u64) {
    vault.level_one.level_two.level_three.charge = amount;
}

public fun set_mode(vault: &mut NestedVault, mode: u64) {
    vault.level_one.level_two.level_three.mode = mode;
}

public fun charge(vault: &NestedVault): u64 {
    vault.level_one.level_two.level_three.charge
}

public fun mode(vault: &NestedVault): u64 {
    vault.level_one.level_two.level_three.mode
}

public fun unlock(vault: NestedVault): NestedVaultFlag {
    let NestedVault { id, level_one } = vault;
    let LevelOneWrap { level_two } = level_one;
    let LevelTwoWrap { level_three } = level_two;
    let LevelThreeCore {
        id: core_id,
        charge,
        mode,
    } = level_three;

    assert!(charge == 100, 0);
    assert!(mode == 7, 1);

    core_id.delete();
    id.delete();
    NestedVaultFlag {}
}
