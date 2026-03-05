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
];
