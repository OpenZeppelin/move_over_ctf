module move_over::split_ledger;

struct Registry has key {
    id: UID,
    count: u64,
}

struct Wallet has key {
    id: UID,
    balance: u64,
}

/// Wrapper for test: hold registry + wallet so solution can mint/burn and return state.
public struct SplitLedgerState has key {
    pub registry: Registry,
    pub wallet: Wallet,
}

public entry fun create(ctx: &mut tx_context::TxContext) {
    let r = Registry { id: object::new(ctx), count: 1 };
    let w = Wallet { id: object::new(ctx), balance: 100 };
    transfer::transfer(r, tx_context::sender(ctx));
    transfer::transfer(w, tx_context::sender(ctx));
}

public fun create_initial(ctx: &mut tx_context::TxContext): SplitLedgerState {
    SplitLedgerState {
        registry: Registry { id: object::new(ctx), count: 1 },
        wallet: Wallet { id: object::new(ctx), balance: 100 },
    }
}

public fun delete(s: SplitLedgerState) {
    let SplitLedgerState { registry, wallet } = s;
    let Registry { id: rid, count: _ } = registry;
    let Wallet { id: wid, balance: _ } = wallet;
    rid.delete();
    wid.delete();
}

public fun is_solved(s: &SplitLedgerState): bool {
    s.registry.count == 0 && s.wallet.balance >= 200
}

public entry fun mint(wallet: &mut Wallet, _registry: &Registry) {
    wallet.balance = wallet.balance + 100;
}

public entry fun burn(wallet: &mut Wallet, registry: &mut Registry) {
    wallet.balance = 0;
    registry.count = registry.count - 1;
}
