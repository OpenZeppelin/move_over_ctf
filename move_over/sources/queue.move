module move_over::queue;
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

public fun create_initial(ctx: &mut tx_context::TxContext): Queue {
    Queue {
        id: object::new(ctx),
        items: vector::empty(),
        max: 5,
    }
}

public fun delete(q: Queue) {
    let Queue { id, items: _, max: _ } = q;
    id.delete();
}

public fun is_solved(q: &Queue): bool {
    vector::length(&q.items) == 0
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
