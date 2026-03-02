import type { Difficulty } from "./types";

/**
 * Level metadata and contract code for the CTF.
 *
 * **Conventions:**
 * - Sui Move only: no `&signer`; use `tx_context::TxContext`, `object::new(ctx)`,
 *   `tx_context::sender(ctx)`, `transfer::transfer`.
 * - Each entry: `id` (index), `difficulty` ("easy" | "medium" | "hard"), `contractCode` (raw Move source).
 *
 * **To add a new level:**
 * 1. Append an object to `LEVEL_META` with the next `id`, `difficulty`, and `contractCode`.
 * 2. Add the same `id` key to every `content/<locale>.json` with `name`, `description`, `instructions`.
 *    See `src/data/levels/README.md` for the content shape and locale list.
 */

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
    solved: bool,
}

public fun create(ctx: &mut tx_context::TxContext): Genesis {
    let obj = Genesis {
        id: object::new(ctx),
        solved: false,
    };
    obj
}

public fun solve(flag: &mut Genesis) {
    flag.solved = true;
}

public fun is_solved(flag: &Genesis): bool {
    flag.solved
}`,
  },
  {
    id: 1,
    difficulty: "easy",
    contractCode: `module move_over::lockbox {

    struct Lockbox has key {
        id: UID,
        locked: bool,
        password: vector<u8>,
        balance: u64,
    }

    public entry fun create(password: vector<u8>, ctx: &mut tx_context::TxContext) {
        let v = Lockbox {
            id: object::new(ctx),
            locked: true,
            password,
            balance: 1000,
        };
        transfer::transfer(v, tx_context::sender(ctx));
    }

    public fun get_password(vault: &Lockbox): vector<u8> {
        *&vault.password
    }

    public entry fun unlock(vault: &mut Lockbox, provided: vector<u8>) {
        if (vault.locked && vault.password == provided) {
            vault.locked = false;
        }
    }

    public entry fun drain(vault: &mut Lockbox, ctx: &mut tx_context::TxContext) {
        assert!(!vault.locked, 1);
        vault.balance = 0;
    }

    public fun is_solved(vault: &Lockbox): bool {
        !vault.locked && vault.balance == 0
    }
}`,
  },
  {
    id: 2,
    difficulty: "easy",
    contractCode: `module move_over::fallout {

    struct Vault has key {
        id: UID,
        owner: address,
        balance: u64,
    }

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let v = Vault {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            balance: 999,
        };
        transfer::transfer(v, tx_context::sender(ctx));
    }

    public fun get_owner(_vault: &Vault): address {
        @0x0
    }

    public entry fun withdraw(vault: &mut Vault, ctx: &mut tx_context::TxContext) {
        if (tx_context::sender(ctx) == get_owner(vault) && vault.balance > 0) {
            vault.balance = 0;
        }
    }

    public fun is_solved(vault: &Vault): bool {
        vault.balance == 0
    }
}`,
  },
  {
    id: 3,
    difficulty: "easy",
    contractCode: `module move_over::blank_check {

    struct Balance has key {
        id: UID,
        value: u64,
    }

    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let b = Balance {
            id: object::new(ctx),
            value: 100,
        };
        transfer::transfer(b, tx_context::sender(ctx));
    }

    public entry fun transfer(bal: &mut Balance, amount: u64, ctx: &mut tx_context::TxContext) {
        bal.value = bal.value - amount;
        if (bal.value == 0) {
            let solved = Solved {};
            transfer::transfer(solved, tx_context::sender(ctx));
        }
    }

    public fun is_solved(bal: &Balance): bool {
        bal.value == 0
    }
}`,
  },
  {
    id: 4,
    difficulty: "medium",
    contractCode: `module move_over::open_door {

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

    public entry fun set_flag(c: &mut Config) {
        c.flag = true;
    }

    public entry fun claim_solved(c: &Config, ctx: &mut tx_context::TxContext) {
        if (c.flag) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }
}`,
  },
  {
    id: 5,
    difficulty: "medium",
    contractCode: `module move_over::double_entry {

    struct Ledger has key {
        id: UID,
        total: u64,
        my_balance: u64,
    }

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let l = Ledger {
            id: object::new(ctx),
            total: 200,
            my_balance: 200,
        };
        transfer::transfer(l, tx_context::sender(ctx));
    }

    public entry fun withdraw(ledger: &mut Ledger, amount: u64) {
        assert!(ledger.my_balance >= amount, 1);
        ledger.total = ledger.total - amount;
        ledger.my_balance = ledger.my_balance - amount;
    }

    public fun is_solved(ledger: &Ledger): bool {
        ledger.total == 0 && ledger.my_balance > 0
    }
}`,
  },
  {
    id: 6,
    difficulty: "medium",
    contractCode: `module move_over::truncation {

    struct Pool has key {
        id: UID,
        total_deposits: u64,
        fee_accumulated: u64,
        shares: u64,
    }

    struct User has key {
        id: UID,
        shares: u64,
    }

    struct Solved has key, store {}

    const FEE_BPS: u64 = 300;

    public entry fun create_pool(ctx: &mut tx_context::TxContext) {
        let p = Pool {
            id: object::new(ctx),
            total_deposits: 0,
            fee_accumulated: 0,
            shares: 0,
        };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    public entry fun deposit(pool: &mut Pool, amount: u64, ctx: &mut tx_context::TxContext) {
        let fee = amount * FEE_BPS / 10000;
        pool.total_deposits = pool.total_deposits + amount;
        pool.fee_accumulated = pool.fee_accumulated + fee;
        pool.shares = pool.shares + (amount - fee);
        let u = User { id: object::new(ctx), shares: amount - fee };
        transfer::transfer(u, tx_context::sender(ctx));
    }

    public entry fun withdraw(pool: &mut Pool, user: &mut User, ctx: &mut tx_context::TxContext) {
        let share = user.shares;
        let fee = share * FEE_BPS / 10000;
        pool.shares = pool.shares - share;
        pool.fee_accumulated = pool.fee_accumulated - fee;
        user.shares = 0;
        if (pool.fee_accumulated == 0 && pool.total_deposits > 0) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }
}`,
  },
  {
    id: 7,
    difficulty: "medium",
    contractCode: `module move_over::split_ledger {

    struct Registry has key {
        id: UID,
        count: u64,
    }

    struct Wallet has key {
        id: UID,
        balance: u64,
    }

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let r = Registry { id: object::new(ctx), count: 1 };
        let w = Wallet { id: object::new(ctx), balance: 100 };
        transfer::transfer(r, tx_context::sender(ctx));
        transfer::transfer(w, tx_context::sender(ctx));
    }

    public entry fun mint(wallet: &mut Wallet, _registry: &Registry) {
        wallet.balance = wallet.balance + 100;
    }

    public entry fun burn(wallet: &mut Wallet, registry: &mut Registry) {
        wallet.balance = 0;
        registry.count = registry.count - 1;
    }

    public fun is_solved(registry: &Registry, wallet: &Wallet): bool {
        registry.count == 0 && wallet.balance >= 200
    }
}`,
  },
  {
    id: 8,
    difficulty: "hard",
    contractCode: `module move_over::jackpot {

    struct Pool has key {
        id: UID,
        deposited: u64,
        claimed: u64,
    }

    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let p = Pool { id: object::new(ctx), deposited: 0, claimed: 0 };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    public entry fun deposit(pool: &mut Pool, amount: u64) {
        pool.deposited = pool.deposited + amount;
    }

    public entry fun claim(pool: &mut Pool, ctx: &mut tx_context::TxContext) {
        if (pool.deposited > 0 && pool.claimed < pool.deposited) {
            pool.claimed = pool.claimed + 100;
            if (pool.claimed >= pool.deposited) {
                transfer::transfer(Solved {}, tx_context::sender(ctx));
            }
        }
    }
}`,
  },
  {
    id: 9,
    difficulty: "hard",
    contractCode: `module move_over::permit {

    struct Permit has key { id: UID, nonce: u64, used: bool }
    struct Treasury has key { id: UID, balance: u64 }
    struct Solved has key, store {}

    public entry fun create_user(ctx: &mut tx_context::TxContext) {
        let p = Permit { id: object::new(ctx), nonce: 0, used: false };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    public entry fun create_treasury(ctx: &mut tx_context::TxContext) {
        let t = Treasury { id: object::new(ctx), balance: 1000 };
        transfer::transfer(t, tx_context::sender(ctx));
    }

    public entry fun spend_with_permit(treasury: &mut Treasury, _permit: &Permit) {
        treasury.balance = 0;
    }

    public entry fun claim_solved(treasury: &Treasury, ctx: &mut tx_context::TxContext) {
        if (treasury.balance == 0) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }
}`,
  },
  {
    id: 10,
    difficulty: "hard",
    contractCode: `module move_over::queue {
    use std::vector;

    struct Queue has key {
        id: UID,
        items: vector<address>,
        max: u64,
    }

    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let q = Queue {
            id: object::new(ctx),
            items: vector::empty(),
            max: 5,
        };
        transfer::transfer(q, tx_context::sender(ctx));
    }

    public entry fun enqueue(q: &mut Queue, ctx: &mut tx_context::TxContext) {
        vector::push_back(&mut q.items, tx_context::sender(ctx));
    }

    public entry fun process(q: &mut Queue, ctx: &mut tx_context::TxContext) {
        let len = vector::length(&q.items);
        assert!(len <= q.max, 1);
        if (len > 0) {
            vector::pop_back(&mut q.items);
        }
        if (vector::length(&q.items) == 0) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }
}`,
  },
  {
    id: 11,
    difficulty: "hard",
    contractCode: `module move_over::price_feed {

    struct Pool has key {
        id: UID,
        price: u64,
        reserves: u64,
        solved: bool,
    }

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let p = Pool {
            id: object::new(ctx),
            price: 100,
            reserves: 10000,
            solved: false,
        };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    public entry fun swap(pool: &mut Pool, amount_in: u64) {
        let out = amount_in * pool.price / 100;
        pool.reserves = pool.reserves - out;
        if (pool.reserves <= 0) {
            pool.solved = true;
        }
    }

    public entry fun set_price(pool: &mut Pool, new_price: u64) {
        pool.price = new_price;
    }

    public fun is_solved(pool: &Pool): bool {
        pool.solved
    }
}`,
  },
  {
    id: 12,
    difficulty: "hard",
    contractCode: `module move_over::master_key {

    struct AdminCap has key { id: UID }
    struct Vault has key {
        id: UID,
        locked: bool,
        balance: u64,
    }

    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let cap = AdminCap { id: object::new(ctx) };
        let vault = Vault {
            id: object::new(ctx),
            locked: true,
            balance: 500,
        };
        transfer::transfer(cap, tx_context::sender(ctx));
        transfer::transfer(vault, tx_context::sender(ctx));
    }

    public entry fun unlock_with_cap(_cap: &AdminCap, vault: &mut Vault) {
        vault.locked = false;
    }

    public entry fun transfer_cap(cap: AdminCap, to: address) {
        transfer::transfer(cap, to);
    }

    public entry fun drain(vault: &mut Vault, ctx: &mut tx_context::TxContext) {
        if (!vault.locked && vault.balance > 0) {
            vault.balance = 0;
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }
}`,
  },
  {
    id: 13,
    difficulty: "hard",
    contractCode: `module move_over::wrapper {

    /// Wrapper holding balance (like sui::balance::Balance). Withdraw updates
    /// balance *after* "sending" - two withdraws in one tx see same balance.
    struct Vault has key {
        id: UID,
        balance: u64,
    }

    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let v = Vault { id: object::new(ctx), balance: 500 };
        transfer::transfer(v, tx_context::sender(ctx));
    }

    public entry fun deposit(vault: &mut Vault, amount: u64) {
        vault.balance = vault.balance + amount;
    }

    /// Takes \`amount\` from vault. Balance is updated *after* the "send" - so
    /// two withdraws in the same tx both see the same balance.
    public entry fun withdraw(vault: &mut Vault, amount: u64, ctx: &mut tx_context::TxContext) {
        assert!(vault.balance >= amount, 1);
        if (vault.balance - amount == 0) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
        vault.balance = vault.balance - amount;
    }

    public fun is_solved(vault: &Vault): bool {
        vault.balance == 0
    }
}`,
  },
  {
    id: 14,
    difficulty: "hard",
    contractCode: `module move_over::ticket_stub {

    /// Deposit gives a Receipt; withdraw consumes it. Receipt is not burned.
    struct Vault has key {
        id: UID,
        balance: u64,
    }

    struct Receipt has key, store { id: UID, amount: u64 }
    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let v = Vault { id: object::new(ctx), balance: 1000 };
        transfer::transfer(v, tx_context::sender(ctx));
    }

    public entry fun deposit(vault: &mut Vault, amount: u64, ctx: &mut tx_context::TxContext) {
        assert!(vault.balance >= amount, 1);
        vault.balance = vault.balance - amount;
        let r = Receipt { id: object::new(ctx), amount };
        transfer::transfer(r, tx_context::sender(ctx));
    }

    public entry fun withdraw(vault: &mut Vault, receipt: &Receipt, ctx: &mut tx_context::TxContext) {
        vault.balance = vault.balance + receipt.amount;
        if (vault.balance >= 1000) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }
}`,
  },
  {
    id: 15,
    difficulty: "hard",
    contractCode: `module move_over::pointer_reassignment {

    /// Lombard-style: reset reassigns pointer so mint decrements wrong field.
    struct Treasury has key {
        id: UID,
        limit: u64,
        left: u64,
    }

    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let t = Treasury {
            id: object::new(ctx),
            limit: 1000,
            left: 1000,
        };
        transfer::transfer(t, tx_context::sender(ctx));
    }

    /// BUG: left = limit reassigns the pointer; then *left = *left - amount
    /// decrements limit instead of left. One call with 1000 drains limit → Solved.
    public entry fun reset_and_mint(t: &mut Treasury, amount: u64, ctx: &mut tx_context::TxContext) {
        let left = &mut t.left;
        let limit = &mut t.limit;
        left = limit;
        assert!(*left >= amount, 1);
        *left = *left - amount;
        if (t.limit == 0) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }

    public fun is_solved(t: &Treasury): bool {
        t.limit == 0
    }
}`,
  },
  {
    id: 16,
    difficulty: "hard",
    contractCode: `module move_over::pool_mismatch {

    /// Navi-style: withdraw takes pool + pool_id but never validates they match.
    struct Pool has key {
        id: UID,
        balance: u64,
    }

    struct Solved has key, store {}

    public entry fun create_vault(ctx: &mut tx_context::TxContext) {
        let p = Pool { id: object::new(ctx), balance: 1000 };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    public entry fun create_pool(ctx: &mut tx_context::TxContext) {
        let p = Pool { id: object::new(ctx), balance: 0 };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    /// BUG: claimed_pool_id is not checked against object::id(pool).
    public entry fun withdraw(
        pool: &mut Pool,
        _claimed_pool_id: address,
        amount: u64,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(pool.balance >= amount, 1);
        pool.balance = pool.balance - amount;
        if (pool.balance == 0) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
    }

    public fun is_solved(pool: &Pool): bool {
        pool.balance == 0
    }
}`,
  },
  {
    id: 17,
    difficulty: "medium",
    contractCode: `module move_over::open_gate {

    /// Aftermath-style: internal helper marked public so anyone can set the flag.
    struct Vault has key {
        id: UID,
        solved: bool,
    }

    struct Solved has key, store {}

    public entry fun create(ctx: &mut tx_context::TxContext) {
        let v = Vault { id: object::new(ctx), solved: false };
        transfer::transfer(v, tx_context::sender(ctx));
    }

    /// BUG: Should be public(package) or require AdminCap. Anyone can call.
    public entry fun set_solved_flag(v: &mut Vault, _ctx: &mut tx_context::TxContext) {
        v.solved = true;
    }

    public entry fun claim_solved(v: &Vault, ctx: &mut tx_context::TxContext) {
        assert!(v.solved, 1);
        transfer::transfer(Solved {}, tx_context::sender(ctx));
    }

    public fun is_solved(v: &Vault): bool {
        v.solved
    }
}`,
  },
  {
    id: 18,
    difficulty: "hard",
    contractCode: `module move_over::wrong_repay {

    /// Cetus-style: receipt stores pool_id but repay never validates it.
    struct Pool has key {
        id: UID,
        balance: u64,
    }

    struct Receipt has key {
        id: UID,
        pool_id: object::ID,
        amount: u64,
    }

    struct Solved has key, store {}

    public entry fun create_victim(ctx: &mut tx_context::TxContext) {
        let p = Pool { id: object::new(ctx), balance: 1000 };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    public entry fun create_attacker(ctx: &mut tx_context::TxContext) {
        let p = Pool { id: object::new(ctx), balance: 0 };
        transfer::transfer(p, tx_context::sender(ctx));
    }

    public entry fun borrow(pool: &mut Pool, amount: u64, ctx: &mut tx_context::TxContext) {
        assert!(pool.balance >= amount, 1);
        pool.balance = pool.balance - amount;
        let r = Receipt {
            id: object::new(ctx),
            pool_id: object::id(pool),
            amount,
        };
        transfer::transfer(r, tx_context::sender(ctx));
    }

    /// BUG: No assert that object::id(pool) == receipt.pool_id.
    public entry fun repay(
        pool: &mut Pool,
        receipt: Receipt,
        ctx: &mut tx_context::TxContext
    ) {
        pool.balance = pool.balance + receipt.amount;
        if (pool.balance >= 1000) {
            transfer::transfer(Solved {}, tx_context::sender(ctx));
        }
        let Receipt { id, pool_id: _, amount: _ } = receipt;
        object::delete(id);
    }
}`,
  },
];
