# n8n-nodes-maker

> [!IMPORTANT]
> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node package for the **Maker/Sky Protocol** - the leading decentralized stablecoin ecosystem on Ethereum. This toolkit provides complete access to DAI, USDS, MKR, SKY tokens, vaults (CDPs), DSR, sDAI, PSM, governance, liquidations, oracles, and more.

[![npm version](https://badge.fury.io/js/n8n-nodes-maker.svg)](https://www.npmjs.com/package/n8n-nodes-maker)
[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Overview

The Maker Protocol is a decentralized organization that creates DAI, a decentralized, unbiased, collateral-backed cryptocurrency pegged to the US Dollar. This n8n node package provides a complete interface to interact with all aspects of the protocol.

### Key Features

- **Token Operations**: DAI, USDS, MKR, SKY, sDAI balances, transfers, and approvals
- **Vault Management**: Open, manage, and monitor collateralized debt positions
- **Savings Rates**: DSR (DAI Savings Rate) and SSR (Sky Savings Rate) operations
- **sDAI (Savings DAI)**: ERC-4626 vault operations for yield-bearing DAI
- **PSM (Peg Stability Module)**: Swap stablecoins for DAI at 1:1 ratio
- **Governance**: Vote on proposals, delegate MKR, monitor governance activity
- **Oracles**: Query real-time price feeds and OSM prices
- **Liquidations**: Monitor at-risk vaults and auction activity
- **Analytics**: Protocol TVL, revenue, supply metrics
- **Event Triggers**: Real-time monitoring of transfers, vault changes, governance votes

## Installation

### Prerequisites

- n8n version 0.200.0 or later
- Node.js 18.0.0 or later

### Install via n8n

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-maker`
4. Click **Install**

### Install via npm

```bash
# In your n8n installation directory
npm install n8n-nodes-maker

# Or globally
npm install -g n8n-nodes-maker
```

### Install from Source

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-maker.git
cd n8n-nodes-maker

# Install dependencies
npm install

# Build the package
npm run build

# Link to your n8n installation
npm link
cd ~/.n8n/custom
npm link n8n-nodes-maker
```

## Configuration

### Maker Network Credentials

Configure your Ethereum connection:

| Field | Description |
|-------|-------------|
| Network | Select network (Mainnet, Goerli, Arbitrum, Optimism, etc.) |
| RPC Endpoint URL | Your RPC provider URL (Alchemy, Infura, etc.) |
| Private Key | Wallet private key for signing transactions |
| DSProxy Address | Optional proxy contract for vault operations |

### Subgraph Credentials (Optional)

For enhanced analytics and historical data:

| Field | Description |
|-------|-------------|
| Subgraph Type | Select Maker, Governance, or custom subgraph |
| API Key | The Graph API key (for decentralized network) |

## Available Operations

### DAI Token

| Operation | Description |
|-----------|-------------|
| Get Balance | Get DAI balance for an address |
| Transfer | Send DAI to another address |
| Approve | Approve spending allowance |
| Get Allowance | Check approved spending amount |
| Get Total Supply | Get total DAI in circulation |
| Get Price | Get current DAI price |
| Get Transfer History | Get transfer events for an address |

### USDS Token (Sky Dollar)

| Operation | Description |
|-----------|-------------|
| Get Balance | Get USDS balance |
| Transfer | Send USDS |
| Convert DAI to USDS | Upgrade DAI to USDS |
| Convert USDS to DAI | Downgrade USDS to DAI |

### MKR Token

| Operation | Description |
|-----------|-------------|
| Get Balance | Get MKR balance |
| Transfer | Send MKR |
| Get Total Supply | Get total MKR supply |
| Get Burn History | View MKR burned by protocol |
| Delegate | Delegate MKR for governance |

### SKY Token

| Operation | Description |
|-----------|-------------|
| Get Balance | Get SKY balance |
| Convert MKR to SKY | Upgrade MKR to SKY |
| Get Total Supply | Get total SKY supply |

### DSR (DAI Savings Rate)

| Operation | Description |
|-----------|-------------|
| Get Current Rate | Get per-second DSR rate |
| Get DSR APY | Get annual percentage yield |
| Get Balance | Get DSR position value |
| Get Chi Value | Get accumulated rate multiplier |
| Get Total DAI in DSR | Get total DAI deposited |
| Deposit DAI | Deposit DAI to earn DSR |
| Withdraw DAI | Withdraw DAI from DSR |
| Calculate Earnings | Project future earnings |

### sDAI (Savings DAI)

| Operation | Description |
|-----------|-------------|
| Get Balance | Get sDAI balance and DAI value |
| Get Exchange Rate | Get sDAI/DAI exchange rate |
| Get APY | Get current yield |
| Deposit | Mint sDAI by depositing DAI |
| Withdraw | Redeem sDAI for DAI |
| Preview Deposit | Calculate sDAI for DAI amount |
| Preview Withdraw | Calculate DAI for sDAI amount |
| Transfer | Send sDAI |

### Vault Operations

| Operation | Description |
|-----------|-------------|
| Get Vaults by Owner | List all vaults for an address |
| Get Vault by ID | Get detailed vault info |
| Get Vault Info | Get vault status and metrics |
| Open Vault | Create new collateralized position |
| Deposit Collateral | Add collateral to vault |
| Withdraw Collateral | Remove collateral from vault |
| Generate DAI | Borrow DAI against collateral |
| Repay DAI | Pay back borrowed DAI |
| Get Collateralization Ratio | Current safety ratio |
| Get Liquidation Price | Price at which vault liquidates |

### Collateral

| Operation | Description |
|-----------|-------------|
| Get Supported Collaterals | List all accepted collateral types |
| Get Collateral Info | Details for specific collateral |
| Get Stability Fee | Current borrowing rate |
| Get Debt Ceiling | Maximum DAI mintable |
| Get Liquidation Ratio | Required collateralization |
| Get Dust Limit | Minimum vault debt |

### PSM (Peg Stability Module)

| Operation | Description |
|-----------|-------------|
| Get PSM Stats | Utilization and capacity |
| Get Supported Gems | List supported stablecoins |
| Get PSM Fee | Swap fees (tin/tout) |
| Get Available Capacity | Remaining swap capacity |
| Swap USDC to DAI | Convert USDC to DAI |
| Swap DAI to USDC | Convert DAI to USDC |

### Governance

| Operation | Description |
|-----------|-------------|
| Get Active Proposals | Current executive proposals |
| Get Current HAT | Leading executive proposal |
| Get Voting Power | MKR voting weight |
| Vote on Executive | Cast vote on executive |
| Vote on Poll | Cast vote on governance poll |
| Delegate MKR | Delegate to representative |
| Get Delegate Info | View delegate details |

### System

| Operation | Description |
|-----------|-------------|
| Get System Status | Overall protocol health |
| Get Global Debt Ceiling | Maximum total DAI |
| Get Total System Debt | Current DAI outstanding |
| Get System Surplus | Protocol revenue balance |
| Get Emergency Shutdown Status | Check if system is live |

### Analytics

| Operation | Description |
|-----------|-------------|
| Get Protocol TVL | Total value locked |
| Get DSR Stats | Savings rate analytics |
| Get Vault Stats | Aggregate vault metrics |
| Get Collateral Distribution | Breakdown by collateral type |

### Utilities

| Operation | Description |
|-----------|-------------|
| Convert Units | WAD/RAY/RAD conversions |
| Get Contract Addresses | Protocol contract addresses |
| Calculate DSR Earnings | Project savings earnings |
| Calculate Collateralization | Compute vault safety ratio |
| Estimate Gas | Get current gas prices |

## Trigger Events

The **Maker Trigger** node monitors real-time events:

| Event | Description |
|-------|-------------|
| DAI Transfer | Any DAI transfer |
| DAI Large Transfer | Transfers above threshold |
| MKR Transfer | Any MKR transfer |
| Vault Created | New vault opened |
| Vault Modified | Vault collateral/debt changed |
| Vault Liquidated | Vault liquidation event |
| sDAI Deposit | DAI deposited to sDAI |
| sDAI Withdrawal | sDAI redeemed |
| DSR Rate Changed | Savings rate updated |
| Price Updated | Oracle price change |
| Governance Vote | Vote cast on proposal |

## Common Use Cases

### 1. Monitor Wallet Balances

```
Maker Node
├── Resource: DAI
├── Operation: Get Balance
└── Address: 0x...
```

### 2. Track DSR Earnings

```
Maker Node
├── Resource: DSR
├── Operation: Get Balance
└── Address: 0x...
```

### 3. Monitor Vault Health

```
Maker Trigger
├── Event: Vault Modified
├── Filter Address: 0x...
└── Poll Interval: 60 seconds
```

### 4. Automate Collateral Alerts

```
Maker Node → IF Node → Slack Node
├── Get Vault Info
├── Check Collateralization Ratio < 200%
└── Send Alert
```

### 5. Track Large DAI Movements

```
Maker Trigger
├── Event: DAI Large Transfer
├── Minimum Amount: 1,000,000
└── Poll Interval: 30 seconds
```

## Technical Details

### Maker Protocol Concepts

| Term | Description |
|------|-------------|
| DAI | Decentralized stablecoin pegged to $1 USD |
| USDS | Sky Dollar - upgraded DAI |
| MKR | Governance token |
| SKY | New governance token |
| Vault (CDP) | Collateralized Debt Position |
| Ilk | Collateral type identifier (e.g., ETH-A) |
| DSR | DAI Savings Rate - earn yield on DAI |
| sDAI | Tokenized DSR position (ERC-4626) |
| PSM | Peg Stability Module - 1:1 stablecoin swaps |
| OSM | Oracle Security Module - delayed price feed |

### Precision Formats

| Format | Decimals | Usage |
|--------|----------|-------|
| WAD | 18 (10^18) | Token amounts |
| RAY | 27 (10^27) | Rates and ratios |
| RAD | 45 (10^45) | Internal accounting |

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Watch Mode

```bash
npm run dev
```

## Dependencies

- **ethers.js v6**: Ethereum interactions
- **graphql-request**: Subgraph queries
- **axios**: HTTP requests

## Security Considerations

- **Never share private keys** - Store securely using n8n credentials
- **Validate vault operations** - Check collateralization before withdrawals
- **Monitor liquidation risk** - Use triggers for at-risk vault alerts
- **Verify contract addresses** - Double-check when using custom networks

## Resources

- [Maker Protocol Documentation](https://docs.makerdao.com/)
- [DAI Stats Dashboard](https://daistats.com/)
- [Maker Governance Portal](https://vote.makerdao.com/)
- [Sky Protocol](https://sky.money/)
- [Spark Protocol](https://spark.fi/)

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-maker/issues)
- **Documentation**: [GitHub Wiki](https://github.com/Velocity-BPA/n8n-nodes-maker/wiki)

## License

This project is licensed under the **Business Source License 1.1 (BSL 1.1)**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Changelog

### 1.0.0 (Initial Release)

- Complete DAI, USDS, MKR, SKY token operations
- Vault (CDP) management
- DSR and sDAI operations
- PSM swap functionality
- Governance voting and delegation
- Oracle price queries
- System monitoring
- Real-time event triggers
- Comprehensive analytics

---

**Built with ❤️ by [Velocity BPA](https://velobpa.com)**
