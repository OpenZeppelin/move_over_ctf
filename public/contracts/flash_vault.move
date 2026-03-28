module move_over::flash_vault;

public struct Token has key, store {
    id: UID,
    value: u64,
}

public struct FlashVault has key {
    id: UID,
    balance: u64,
    next_nonce: u64,
}

/// No abilities — must be consumed within the transaction.
public struct Receipt {
    vault_id: ID,
    borrower: address,
    nonce: u64,
    amount: u64,
}

public struct FlashVaultFlag has copy, drop {}

const EZERO_AMOUNT: u64 = 0;
const EINSUFFICIENT_LIQUIDITY: u64 = 1;
const EWRONG_VAULT: u64 = 2;
const EWRONG_BORROWER: u64 = 3;
const ENONCE_MISMATCH: u64 = 4;
const EINSUFFICIENT_REPAYMENT: u64 = 5;
const ENOT_DRAINED: u64 = 6;

/// Initialize the flash loan vault with available liquidity.
public fun create_vault(amount: u64, ctx: &mut TxContext): FlashVault {
    FlashVault {
        id: object::new(ctx),
        balance: amount,
        next_nonce: 1,
    }
}

/// Borrow tokens from the vault. Returns a token and a receipt that must be settled.
public fun borrow(vault: &mut FlashVault, amount: u64, ctx: &mut TxContext): (Token, Receipt) {
    assert!(amount > 0, EZERO_AMOUNT);
    assert!(vault.balance >= amount, EINSUFFICIENT_LIQUIDITY);
    let nonce = vault.next_nonce;
    vault.balance = vault.balance - amount;
    vault.next_nonce = nonce + 1;
    (
        Token { id: object::new(ctx), value: amount },
        Receipt {
            vault_id: object::id(&vault.id),
            borrower: ctx.sender(),
            nonce,
            amount,
        },
    )
}

/// Repay the borrowed amount. Settles the receipt.
public fun repay(vault: &mut FlashVault, receipt: Receipt, payment: Token, ctx: &TxContext) {
    let Receipt {
        vault_id,
        borrower,
        nonce,
        amount,
    } = receipt;
    assert!(vault_id == object::id(&vault.id), EWRONG_VAULT);
    assert!(borrower == ctx.sender(), EWRONG_BORROWER);
    assert!(nonce + 1 == vault.next_nonce, ENONCE_MISMATCH);
    assert!(payment.value >= amount, EINSUFFICIENT_REPAYMENT);
    let Token { id, value } = payment;
    id.delete();
    vault.balance = vault.balance + value;
}

/// Cancel a pending borrow to start over.
public fun cancel(vault: &mut FlashVault, receipt: Receipt, ctx: &TxContext) {
    let Receipt {
        vault_id,
        borrower,
        nonce,
        amount: _,
    } = receipt;
    assert!(vault_id == object::id(&vault.id), EWRONG_VAULT);
    assert!(borrower == ctx.sender(), EWRONG_BORROWER);
    assert!(nonce + 1 == vault.next_nonce, ENONCE_MISMATCH);
}

/// Prove you drained the vault.
public fun solve(vault: FlashVault): FlashVaultFlag {
    assert!(vault.balance == 0, ENOT_DRAINED);
    let FlashVault {
        id,
        balance: _,
        next_nonce: _,
    } = vault;
    id.delete();
    FlashVaultFlag {}
}
