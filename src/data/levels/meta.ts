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
    id: 1,
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
    id: 3,
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
  {
    id: 4,
    difficulty: "easy",
    contractCode: `module move_over::sticky_treasure_dof;

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
}`,
    contractModules: [
      {
        module: "sticky_treasure_dof",
        contractCode: `module move_over::sticky_treasure_dof;

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
}`,
      },
    ],
  },
];
