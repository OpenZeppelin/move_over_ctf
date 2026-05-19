module move_over::blackbook_math;

const SHIFT_BITS: u8 = 32;
const HIGH_BITS_OFFSET: u8 = 96;

public fun full_mul_u128(a: u128, b: u128): u128 {
    a * b
}

public fun quote_required_margin(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    liquidity: u128,
    round_up: bool,
): (u64, bool) {
    quote_from_roots(sqrt_price_0, sqrt_price_1, liquidity, round_up)
}

public fun payout_from_liquidity(liquidity: u128, shift: u8): u64 {
    let scaled = (liquidity >> shift) as u64;
    if (scaled == 0) {
        1
    } else {
        scaled
    }
}

fun quote_from_roots(
    sqrt_price_0: u128,
    sqrt_price_1: u128,
    liquidity: u128,
    round_up: bool,
): (u64, bool) {
    let sqrt_price_diff = abs_diff(sqrt_price_0, sqrt_price_1);

    if (sqrt_price_diff == 0 || liquidity == 0) {
        return (0, false)
    };

    let (numerator, overflowing) = checked_shlw(full_mul_u128(liquidity, sqrt_price_diff));

    if (overflowing) {
        return (0, true)
    };

    let denominator = full_mul_u128(sqrt_price_0, sqrt_price_1);
    let quotient = div_round(numerator, denominator, round_up);

    ((quotient as u64), false)
}

public fun checked_shlw(n: u128): (u128, bool) {
    let mask = 0xffffffffu128 << HIGH_BITS_OFFSET;
    if (n > mask) {
        (0, true)
    } else {
        (n << SHIFT_BITS, false)
    }
}

public fun checked_shlw_strict(n: u128): (u128, bool) {
    let limit = 1u128 << HIGH_BITS_OFFSET;
    if (n >= limit) {
        (0, true)
    } else {
        (n << SHIFT_BITS, false)
    }
}

public fun div_round(numerator: u128, denominator: u128, round_up: bool): u128 {
    let quotient = numerator / denominator;
    let remainder = numerator % denominator;

    if (round_up && remainder > 0) {
        quotient + 1
    } else {
        quotient
    }
}

public fun abs_diff(a: u128, b: u128): u128 {
    if (a > b) {
        a - b
    } else {
        b - a
    }
}
