module move_over::relay_core;

public struct RelayPermit has copy, drop {}

public fun issue_permit(pin: u64): RelayPermit {
    assert!(pin == 1337, 1);
    RelayPermit {}
}
