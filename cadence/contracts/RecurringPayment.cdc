// cadence/contracts/RecurringPayment.cdc
// Defines structure and events for recurring payment actions.
// The actual transfer logic should be implemented in a transaction.

access(all) contract RecurringPayment {

    /// @notice Data required to execute a recurring payment action.
    access(all) struct ActionData {
        /// The address receiving the payment.
        access(all) let recipient: Address
        /// The amount of tokens to be transferred.
        access(all) let amount: UFix64
        /// A string identifier for the token type (e.g., "FlowToken", "FUSD").
        /// This should be used by the executing transaction to interact with the correct vault type.
        access(all) let tokenType: String

        init(recipient: Address, amount: UFix64, tokenType: String) {
            pre {
                recipient != Address(0x0): "Recipient address cannot be zero"
                amount > 0.0: "Payment amount must be positive"
                tokenType.length > 0: "Token type cannot be empty"
            }
            self.recipient = recipient
            self.amount = amount
            self.tokenType = tokenType
        }
    }

    // --- Events ---

    /// @notice Emitted when a recurring payment action is successfully executed.
    /// @param recipient The address that received the payment.
    /// @param amount The amount transferred.
    /// @param tokenType A string identifier for the token type.
    /// @param sender The address that initiated the payment.
    /// @param transactionId The ID of the transaction executing the payment.
    access(all) event PaymentExecuted(
        recipient: Address,
        amount: UFix64,
        tokenType: String,
        sender: Address,
        transactionId: UInt64
    )

    // Optional: Keep validate function for off-chain checks if desired.
    access(all) fun validate(data: ActionData): Bool {
        // Validation now handled by initializer preconditions.
        // Add specific validation logic here if needed beyond basic checks.
        return true
    }


    init() {
        // Initialization logic (if any)
    }
}