// cadence/contracts/StakingClaim.cdc
// Defines structure and events for claiming and compounding staking rewards actions.
// The actual claim/compound logic should be implemented in a transaction.

access(all) contract StakingClaim {

    /// @notice Data required to execute a staking reward claim action.
    access(all) struct ActionData {
        /// The address of the target staking contract or pool resource.
        access(all) let stakingPoolAddress: Address
        /// Flag indicating whether claimed rewards should be restaked.
        access(all) let compound: Bool

        init(stakingPoolAddress: Address, compound: Bool) {
            pre {
                stakingPoolAddress != Address(0x0): "Staking pool address cannot be zero"
            }
            self.stakingPoolAddress = stakingPoolAddress
            self.compound = compound
        }
    }

    // --- Events ---

    /// @notice Emitted when a staking claim action is successfully executed.
    /// @param poolAddress The address associated with the staking pool.
    /// @param compound Whether the rewards were compounded.
    /// @param claimer The address of the account that claimed the rewards.
    /// @param claimedAmount The amount of rewards claimed.
    /// @param compoundedAmount The amount of rewards restaked (0.0 if compound is false).
    /// @param transactionId The ID of the transaction executing the claim.
    access(all) event ClaimExecuted(
        poolAddress: Address,
        compound: Bool,
        claimer: Address,
        claimedAmount: UFix64,
        compoundedAmount: UFix64,
        transactionId: UInt64
    )

    // Optional: Keep validate function for off-chain checks if desired.
    access(all) fun validate(data: ActionData): Bool {
        // Validation now handled by initializer precondition.
        // Add specific validation logic here if needed beyond basic checks.
        return true
    }

    init() {
        // Initialization logic (if any)
    }
}