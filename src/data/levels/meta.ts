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
    id: 3,
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
    id: 4,
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
    id: 5,
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
];
