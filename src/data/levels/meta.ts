import type { Difficulty } from "./types";

interface LevelMeta {
  id: number;
  difficulty: Difficulty;
  contractCode: string;
  contractModules: Array<{
    module: string;
    contractCode: string;
  }>;
}

export const LEVEL_META: LevelMeta[] = [
  {
    id: 0,
    difficulty: "easy",
    contractCode: `module move_over::genesis;

public struct Genesis has key {
    id: UID,
    value: u64,
}

public struct GenesisFlag has copy, drop {}

public fun create(number: u64, ctx: &mut tx_context::TxContext): Genesis {
    Genesis {
        id: object::new(ctx),
        value: number,
    }
}

public fun solve(flag: Genesis): GenesisFlag {
    let Genesis { id, value } = flag;
    assert!(value == 2, 1);

    id.delete();
    GenesisFlag {}
}`,
    contractModules: [
      {
        module: "genesis",
        contractCode: `module move_over::genesis;

public struct Genesis has key {
    id: UID,
    value: u64,
}

public struct GenesisFlag has copy, drop {}

public fun create(number: u64, ctx: &mut tx_context::TxContext): Genesis {
    Genesis {
        id: object::new(ctx),
        value: number,
    }
}

public fun solve(flag: Genesis): GenesisFlag {
    let Genesis { id, value } = flag;
    assert!(value == 2, 1);

    id.delete();
    GenesisFlag {}
}`,
      },
    ],
  },
  {
    id: 1,
    difficulty: "easy",
    contractCode: `module move_over::lockbox;

struct Lockbox has key {
    id: UID,
    password: vector<u8>,
}

struct UnlockTicket has copy, drop {}

struct LockboxFlag has copy, drop {}

public fun create(password: vector<u8>, ctx: &mut tx_context::TxContext): Lockbox {
    Lockbox {
        id: object::new(ctx),
        password,
    }
}

public fun delete(vault: Lockbox) {
    let Lockbox { id, password: _ } = vault;
    id.delete();
}

public fun get_password(vault: &Lockbox): vector<u8> {
    *&vault.password
}

public fun unlock(_vault: &Lockbox, _provided: vector<u8>): UnlockTicket {
    UnlockTicket {}
}

public fun drain(
    vault: Lockbox,
    _ticket: UnlockTicket,
    _ctx: &mut tx_context::TxContext,
): LockboxFlag {
    let Lockbox { id, password: _ } = vault;
    id.delete();
    LockboxFlag {}
}`,
    contractModules: [
      {
        module: "lockbox",
        contractCode: `module move_over::lockbox;

struct Lockbox has key {
    id: UID,
    password: vector<u8>,
}

struct UnlockTicket has copy, drop {}

struct LockboxFlag has copy, drop {}

public fun create(password: vector<u8>, ctx: &mut tx_context::TxContext): Lockbox {
    Lockbox {
        id: object::new(ctx),
        password,
    }
}

public fun delete(vault: Lockbox) {
    let Lockbox { id, password: _ } = vault;
    id.delete();
}

public fun get_password(vault: &Lockbox): vector<u8> {
    *&vault.password
}

public fun unlock(_vault: &Lockbox, _provided: vector<u8>): UnlockTicket {
    UnlockTicket {}
}

public fun drain(
    vault: Lockbox,
    _ticket: UnlockTicket,
    _ctx: &mut tx_context::TxContext,
): LockboxFlag {
    let Lockbox { id, password: _ } = vault;
    id.delete();
    LockboxFlag {}
}`,
      },
    ],
  },
  {
    id: 2,
    difficulty: "easy",
    contractCode: `module move_over::fallout;

struct Vault has key {
    id: UID,
    owner: address,
}

struct FalloutFlag has copy, drop {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let v = create_initial(ctx);
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        owner: @0x0,
    }
}

public fun get_owner(_vault: &Vault): address {
    @0x0
}

public fun withdraw(vault: Vault, _ctx: &mut tx_context::TxContext): FalloutFlag {
    let Vault { id, owner: _ } = vault;
    id.delete();
    FalloutFlag {}
}`,
    contractModules: [
      {
        module: "fallout",
        contractCode: `module move_over::fallout;

struct Vault has key {
    id: UID,
    owner: address,
}

struct FalloutFlag has copy, drop {}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let v = create_initial(ctx);
    transfer::transfer(v, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): Vault {
    Vault {
        id: object::new(ctx),
        owner: @0x0,
    }
}

public fun get_owner(_vault: &Vault): address {
    @0x0
}

public fun withdraw(vault: Vault, _ctx: &mut tx_context::TxContext): FalloutFlag {
    let Vault { id, owner: _ } = vault;
    id.delete();
    FalloutFlag {}
}`,
      },
    ],
  },
  {
    id: 3,
    difficulty: "medium",
    contractCode: `module move_over::relay_gateway;

use move_over::relay_core;

public struct RelayVault has key {
    id: UID,
}

public struct RelayFlag has copy, drop {}

public fun create(ctx: &mut tx_context::TxContext): RelayVault {
    RelayVault {
        id: object::new(ctx),
    }
}

public fun open(vault: RelayVault, pin: u64): RelayFlag {
    let _permit = relay_core::issue_permit(pin);
    let RelayVault { id } = vault;
    id.delete();
    RelayFlag {}
}`,
    contractModules: [
      {
        module: "relay_core",
        contractCode: `module move_over::relay_core;

public struct RelayPermit has copy, drop {}

public fun issue_permit(pin: u64): RelayPermit {
    assert!(pin == 1337, 1);
    RelayPermit {}
}`,
      },
      {
        module: "relay_gateway",
        contractCode: `module move_over::relay_gateway;

use move_over::relay_core;

public struct RelayVault has key {
    id: UID,
}

public struct RelayFlag has copy, drop {}

public fun create(ctx: &mut tx_context::TxContext): RelayVault {
    RelayVault {
        id: object::new(ctx),
    }
}

public fun open(vault: RelayVault, pin: u64): RelayFlag {
    let _permit = relay_core::issue_permit(pin);
    let RelayVault { id } = vault;
    id.delete();
    RelayFlag {}
}`,
      },
    ],
  },
  {
    id: 4,
    difficulty: "easy",
    contractCode: `module move_over::artifact;

public struct Artifact has key {
    id: UID,
    power: u64,
}

public struct ArtifactFlag has copy, drop {}

public fun forge(ctx: &mut TxContext): Artifact {
    Artifact {
        id: object::new(ctx),
        power: 0,
    }
}

public fun charge(artifact: &mut Artifact, energy: u64) {
    artifact.power = artifact.power + energy;
}

public fun shatter(artifact: Artifact): ArtifactFlag {
    let Artifact { id, power } = artifact;
    assert!(power == 100, 0);
    id.delete();
    ArtifactFlag {}
}`,
    contractModules: [
      {
        module: "artifact",
        contractCode: `module move_over::artifact;

public struct Artifact has key {
    id: UID,
    power: u64,
}

public struct ArtifactFlag has copy, drop {}

public fun forge(ctx: &mut TxContext): Artifact {
    Artifact {
        id: object::new(ctx),
        power: 0,
    }
}

public fun charge(artifact: &mut Artifact, energy: u64) {
    artifact.power = artifact.power + energy;
}

public fun shatter(artifact: Artifact): ArtifactFlag {
    let Artifact { id, power } = artifact;
    assert!(power == 100, 0);
    id.delete();
    ArtifactFlag {}
}`,
      },
    ],
  },
  {
    id: 5,
    difficulty: "easy",
    contractCode: `module move_over::coin_collector;

public struct Token has key, store {
    id: UID,
    value: u64,
}

public struct CoinCollectorFlag has copy, drop {}

public fun faucet(ctx: &mut TxContext): Token {
    Token { id: object::new(ctx), value: 100 }
}

public fun split(token: &mut Token, amount: u64, ctx: &mut TxContext): Token {
    assert!(token.value >= amount, 0);
    token.value = token.value - amount;
    Token { id: object::new(ctx), value: amount }
}

public fun merge(token: &mut Token, other: Token) {
    let Token { id, value } = other;
    id.delete();
    token.value = token.value + value;
}

public fun buy_prize(payment: Token): CoinCollectorFlag {
    let Token { id, value: _ } = payment;
    id.delete();
    CoinCollectorFlag {}
}

public fun value(token: &Token): u64 {
    token.value
}

public fun destroy_zero(token: Token) {
    assert!(token.value == 0, 0);
    let Token { id, value: _ } = token;
    id.delete();
}`,
    contractModules: [
      {
        module: "coin_collector",
        contractCode: `module move_over::coin_collector;

public struct Token has key, store {
    id: UID,
    value: u64,
}

public struct CoinCollectorFlag has copy, drop {}

public fun faucet(ctx: &mut TxContext): Token {
    Token { id: object::new(ctx), value: 100 }
}

public fun split(token: &mut Token, amount: u64, ctx: &mut TxContext): Token {
    assert!(token.value >= amount, 0);
    token.value = token.value - amount;
    Token { id: object::new(ctx), value: amount }
}

public fun merge(token: &mut Token, other: Token) {
    let Token { id, value } = other;
    id.delete();
    token.value = token.value + value;
}

public fun buy_prize(payment: Token): CoinCollectorFlag {
    let Token { id, value: _ } = payment;
    id.delete();
    CoinCollectorFlag {}
}

public fun value(token: &Token): u64 {
    token.value
}

public fun destroy_zero(token: Token) {
    assert!(token.value == 0, 0);
    let Token { id, value: _ } = token;
    id.delete();
}`,
      },
    ],
  },
  {
    id: 6,
    difficulty: "easy",
    contractCode: `module move_over::nested_vault;

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
}`,
    contractModules: [
      {
        module: "nested_vault",
        contractCode: `module move_over::nested_vault;

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
}`,
      },
    ],
  },
  {
    id: 7,
    difficulty: "easy",
    contractCode: `module move_over::sticky_treasure;

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
}`,
    contractModules: [
      {
        module: "sticky_treasure",
        contractCode: `module move_over::sticky_treasure;

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
}`,
      },
    ],
  },
];
