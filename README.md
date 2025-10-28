# FlowGPT 🚀

**The ChatGPT for Flow blockchain** - A conversational AI assistant that automates crypto workflows through natural dialogue, powered by Flow's new Forte primitives.

![FlowGPT](https://img.shields.io/badge/FlowGPT-AI%20Blockchain%20Assistant-purple)
![Flow Forte](https://img.shields.io/badge/Flow-Forte-orange)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

---

## 🎯 What is FlowGPT?

FlowGPT is like having a personal blockchain assistant. Instead of writing smart contracts or filling forms, you **talk to an AI** that:

- Understands your goals through natural conversation
- Asks clarifying questions
- Reads your wallet context
- Suggests optimizations and warns about risks
- Generates and deploys automated workflows

**No coding required. Just talk to your blockchain.** 💬

---

## ✨ Key Features

### 💬 Conversational Interface

Chat naturally with your blockchain assistant:

```
You: "I want to pay my team every Friday"
FlowGPT: "How many team members do you have?"
You: "Three - Alice gets 100 FLOW, Bob gets 75, Charlie gets 50"
FlowGPT: "Perfect! Should I set this up as a recurring workflow?"
You: "Yes"
[FlowGPT deploys automated weekly payroll]
```

### 🧠 Context-Aware Intelligence

- Reads your wallet balance in real-time
- Analyzes existing workflows
- Provides personalized suggestions
- Warns about insufficient funds or risks

### 🎤 Multi-Modal Input

- 💬 Type messages (like ChatGPT)
- 🎙️ Voice input for hands-free operation
- Seamless switching between modes

### ⚡ Powered by Flow Forte

- **FLIP-338 Actions**: Reusable onchain building blocks
- **Scheduled Transactions**: Native time-based execution
- No external servers or keepers needed

---

## 🏆 Use Cases

| Use Case          | User Says                               | FlowGPT Does                 |
| ----------------- | --------------------------------------- | ---------------------------- |
| **Payroll**       | "Pay my team every 2 weeks"             | Schedules recurring payments |
| **DCA Strategy**  | "Buy $100 of token X weekly"            | Automated token purchases    |
| **Reward Claims** | "Claim my staking rewards monthly"      | Auto-claims and compounds    |
| **NFT Drops**     | "Send 100 NFTs to whitelist on Dec 1st" | Scheduled batch distribution |
| **Governance**    | "Vote YES on proposal #42 in 24 hours"  | Delayed governance voting    |

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** (React 19 + TypeScript)
- **Groq API** (Llama 3 for AI)
- **FCL** for wallet integration
- **Web Speech API** for voice input
- **Shadcn UI** for beautiful components

### Smart Contracts (Cadence)

- **WorkflowRegistry.cdc**: Core workflow management
- **5 Action Contracts**: RecurringPayment, TokenSwap, BatchTransfer, StakingClaim, GovernanceVote
- FLIP-338 compliant actions
- Scheduled Transactions for automation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Flow wallet (for testing)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GROQ_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Connect Your Wallet

1. Click "Connect Wallet"
2. Choose a wallet (e.g., Flow Wallet, Blocto)
3. Approve connection

### Start Chatting

Simply type your automation request:

```
"I want to pay my team 100 FLOW every Friday"
```

FlowGPT will guide you through the rest!

---

## 📁 Project Structure

```
flow/
├── cadence/
│   ├── contracts/
│   │   ├── WorkflowRegistry.cdc      # Main registry
│   │   ├── RecurringPayment.cdc      # Payment actions
│   │   ├── TokenSwap.cdc             # Swap actions
│   │   ├── BatchTransfer.cdc         # Batch actions
│   │   ├── StakingClaim.cdc          # Staking actions
│   │   └── GovernanceVote.cdc       # Governance actions
│   ├── transactions/
│   │   ├── schedule-mint.cdc
│   │   ├── schedule-transfer.cdc
│   │   └── cancel-workflow.cdc
│   └── scripts/
│       └── GetCounter.cdc
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts          # AI chat endpoint
│   │   ├── page.tsx                  # Main page
│   │   └── layout.tsx
│   ├── components/
│   │   ├── custom/
│   │   │   ├── chat-interface.tsx    # ChatGPT-style UI
│   │   │   ├── workflow-card.tsx
│   │   │   ├── workflow-input.tsx
│   │   │   └── workflow-preview.tsx
│   │   └── ui/                       # Shadcn components
│   └── lib/
│       ├── groq/
│       │   └── client.ts              # Groq AI integration
│       ├── flow/
│       │   ├── workflow.ts            # Workflow management
│       │   └── config.ts
│       └── cadence/
│           └── generator.ts           # Cadence code generation
└── package.json
```

---

## 🧠 How It Works

### 1. **User Chat**

User describes their automation goal in natural language.

### 2. **AI Processing**

Groq AI (Llama 3) analyzes the request and asks clarifying questions if needed.

### 3. **Workflow Generation**

AI generates structured workflow with:

- Trigger configuration (time, event, condition)
- Action parameters (amounts, recipients, schedules)
- Contract selection (RecurringPayment, TokenSwap, etc.)

### 4. **Validation**

System checks:

- User has sufficient balance
- Recipient addresses are valid
- Schedule is feasible

### 5. **Deployment**

Workflow is deployed to Flow blockchain as:

- Scheduled transaction (time-based)
- Event listener (event-based)
- Conditional monitor (condition-based)

### 6. **Execution**

Flow blockchain automatically executes workflows on schedule.

---

## 🎨 UI Components

FlowGPT uses **Shadcn UI** for beautiful, accessible components:

- `Button` - Styled buttons
- `Card` - Container for content
- `Textarea` - Multi-line input
- `Badge` - Status indicators
- `Dropdown Menu` - Navigation menus

All components are fully typed with TypeScript and customizable.

---

## 🔧 Smart Contracts

### WorkflowRegistry.cdc

Main registry that tracks all workflows:

- Stores workflow metadata
- Manages execution status
- Records execution history
- Provides query interface

### Action Contracts (FLIP-338)

Each workflow type has its own action contract:

1. **RecurringPayment**: Scheduled token transfers
2. **TokenSwap**: DCA token purchasing
3. **BatchTransfer**: Batch payments/airdrops
4. **StakingClaim**: Reward claiming and compounding
5. **GovernanceVote**: Delayed governance voting

---

## 🌊 Flow Forte Integration

FlowGPT leverages Flow's new Forte features:

### Scheduled Transactions

Native time-based execution without external keepers.

```cadence
transaction(id: String, amount: UFix64, recipient: Address, interval: UInt64) {
  prepare(signer: AuthAccount) {
    // Scheduled transaction logic
  }
}
```

### FLIP-338 Actions

Reusable onchain building blocks that work across different workflows.

```cadence
access(all) contract RecurringPayment {
  access(all) struct ActionData {
    access(all) let recipient: Address
    access(all) let amount: UFix64
  }

  access(all) fun execute(data: ActionData): Bool {
    // Execute payment
  }
}
```

---

## 🎯 Target Bounties

FlowGPT is designed to win multiple Flow hackathon bounties:

| Bounty                 | Prize        | Why We'll Win                      |
| ---------------------- | ------------ | ---------------------------------- |
| **Best Killer App**    | $8,000       | Consumer-friendly AI interface     |
| **Best Forte Actions** | $6,000       | 5 FLIP-338 actions + Scheduled Txs |
| **Vibe Coded**         | $1,000       | Heavy AI usage throughout          |
| **Total Target**       | **$15,000+** | Multiple bounty overlap            |

---

## 🚦 Getting Started Guide

### For Users

1. **Connect Wallet**

   - Click "Connect Wallet" in top-right
   - Approve connection

2. **Start Chatting**

   - Describe what you want to automate
   - FlowGPT will ask clarifying questions
   - Confirm the workflow

3. **Deploy & Enjoy**
   - Click "Deploy Workflow"
   - Sign the transaction
   - Your automation is live!

### For Developers

1. **Clone Repository**

   ```bash
   git clone https://github.com/yourusername/flowgpt.git
   cd flowgpt
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Add your GROQ_API_KEY
   ```

4. **Run Locally**

   ```bash
   npm run dev
   ```

5. **Deploy Smart Contracts** (Optional)
   ```bash
   flow deploy
   ```

---

## 🤝 Contributing

FlowGPT is built for the Flow hackathon! Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

MIT License - feel free to use this code!

---

## 🙏 Acknowledgments

- **Flow Foundation** - For building the best blockchain platform
- **Groq** - For blazing-fast AI inference
- **Shadcn** - For beautiful UI components
- **The Flow Community** - For inspiration and support

---

## 📞 Contact

- **Website**: [flowgpt.app](https://flowgpt.app)
- **Twitter**: [@FlowGPT](https://twitter.com/flowgpt)
- **Discord**: [Flow Ecosystem](https://discord.gg/flow)

---

**Built with ❤️ for the Flow hackathon**

_"Automate your crypto workflows through conversation"_ 💬⚡
