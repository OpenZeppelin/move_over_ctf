import type { Difficulty } from "./types";

export interface LevelMeta {
  id: number;
  difficulty: Difficulty;
  contractCode: string;
}

export const LEVEL_META: LevelMeta[] = [
  {
    id: 0,
    difficulty: "easy",
    contractCode: `module move_over::genesis;

public struct Genesis has key {
    id: UID,
}

public struct GenesisFlag has copy, drop {}

public fun create(ctx: &mut tx_context::TxContext): Genesis {
    Genesis {
        id: object::new(ctx),
    }
}

public fun solve(flag: Genesis, number: u64): GenesisFlag {
    assert!(number == 1, 1);

    let Genesis { id } = flag;
    id.delete();
    GenesisFlag {}
}`,
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
  },
];
