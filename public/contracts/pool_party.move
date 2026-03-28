module move_over::pool_party;

public struct Pool has key {
    id: UID,
    name: vector<u8>,
    balance: u64,
    next_nonce: u64,
}

/// No abilities — must be consumed within the transaction.
public struct Receipt {
    pool_id: ID,
    borrower: address,
    nonce: u64,
    amount: u64,
}

public struct PoolPartyFlag has copy, drop {}

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_BORROWER: u64 = 2;
const ENONCE_MISMATCH: u64 = 3;
const EINSUFFICIENT_REPAYMENT: u64 = 4;
const ENOT_DRAINED: u64 = 5;
const EINVALID_POOL_ID: u64 = 6;

public fun create_pool_a(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Treasury",
        balance: 100_000,
        next_nonce: 3,
    }
}

public fun create_pool_b(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"DryRun",
        balance: 0,
        next_nonce: 1,
    }
}

public fun create_pool_c(ctx: &mut TxContext): Pool {
    Pool {
        id: object::new(ctx),
        name: b"Auxiliary",
        balance: 10,
        next_nonce: 2,
    }
}

public fun borrow(pool: &mut Pool, amount: u64, ctx: &TxContext): (u64, Receipt) {
    assert!(amount > 0, EZERO_AMOUNT);
    assert!(pool.balance >= amount, EINSUFFICIENT_LIQUIDITY);
    let nonce = pool.next_nonce;
    pool.balance = pool.balance - amount;
    pool.next_nonce = nonce + 1;
    let receipt = Receipt {
        pool_id: object::id(&pool.id),
        borrower: tx_context::sender(ctx),
        nonce,
        amount,
    };
    (amount, receipt)
}

public fun repay(
    pool: &mut Pool,
    receipt_pool_id: ID,
    receipt: Receipt,
    repayment: u64,
    ctx: &TxContext,
) {
    let Receipt {
        pool_id,
        borrower,
        nonce,
        amount,
    } = receipt;
    assert!(pool_id == receipt_pool_id, EINVALID_POOL_ID);
    assert!(borrower == tx_context::sender(ctx), EWRONG_BORROWER);
    assert!(nonce + 1 == pool.next_nonce, ENONCE_MISMATCH);
    assert!(repayment >= amount, EINSUFFICIENT_REPAYMENT);
    pool.balance = pool.balance + repayment;
}

public fun solve(pool_a: Pool): PoolPartyFlag {
    assert!(pool_a.balance == 0, ENOT_DRAINED);
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
    } = pool_a;
    id.delete();
    PoolPartyFlag {}
}

public fun destroy_pool(pool: Pool) {
    let Pool {
        id,
        name: _,
        balance: _,
        next_nonce: _,
    } = pool;
    id.delete();
}

/// Getter functions
public fun pool_id(pool: &Pool): ID {
    object::id(&pool.id)
}

public fun balance(pool: &Pool): u64 {
    pool.balance
}

public fun next_nonce(pool: &Pool): u64 {
    pool.next_nonce
}
