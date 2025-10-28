// cadence/contracts/BatchTransfer.cdc
// Defines structures and events for batch transfers (e.g., airdrops, payroll)
// The actual transfer logic should be implemented in a transaction
// that utilizes these definitions.

access(all) contract BatchTransfer {

    /// @notice Details for a single transfer within a batch.
    access(all) struct TransferItem {
        access(all) let recipient: Address
        access(all) let amount: UFix64

        init(recipient: Address, amount: UFix64) {
            pre {
                amount > 0.0: "Transfer amount must be positive"
                // Basic address validity check (not nil)
                recipient != Address(0x0): "Recipient address cannot be zero"
            }
            self.recipient = recipient
            self.amount = amount
        }
    }

    // --- Events ---

    /// @notice Emitted when a single transfer within a batch is successfully executed.
    /// @param recipient The address receiving the tokens.
    /// @param amount The amount of tokens transferred.
    /// @param tokenType A string identifier for the token type (e.g., "FlowToken", "FUSD").
    /// @param sender The address sending the tokens (added for better tracking).
    /// @param transactionId The ID of the transaction executing the batch.
    access(all) event TransferExecuted(
        recipient: Address,
        amount: UFix64,
        tokenType: String,
        sender: Address,
        transactionId: UInt64
    )

    /// @notice Emitted when the entire batch transfer transaction completes.
    /// @param totalTransfers The total number of transfers attempted in the batch.
    /// @param successfulTransfers The number of transfers that succeeded.
    /// @param tokenType A string identifier for the token type.
    /// @param sender The address that initiated the batch transfer.
    /// @param transactionId The ID of the transaction executing the batch.
    access(all) event BatchTransferComplete(
        totalTransfers: Int,
        successfulTransfers: Int,
        tokenType: String,
        sender: Address,
        transactionId: UInt64
    )

    init() {
        // Initialization logic (if any)
    }
}