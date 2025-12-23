# Push to GitHub

```bash
# Extract and navigate
unzip n8n-nodes-maker.zip
cd n8n-nodes-maker

# Initialize and push
git init
git add .
git commit -m "Initial commit: n8n Maker/Sky Protocol community node

Licensed under Business Source License 1.1 (BSL 1.1)
Commercial use requires a license from Velocity BPA.

Features:
- DAI: Get balance, transfer, approve, allowance, total supply, price
- USDS: Get balance, transfer, convert DAI/USDS
- MKR: Get balance, transfer, total supply, burn history, delegate
- SKY: Get balance, transfer, convert from MKR
- DSR: Get rate, APY, balance, chi value, deposit, withdraw
- sDAI: Get balance, exchange rate, deposit, withdraw, preview
- Vault: Get vaults, open, deposit/withdraw collateral, generate/repay DAI
- Collateral: Get supported types, info, stability fee, debt ceiling
- PSM: Get stats, swap USDC/DAI, get fees and capacity
- Oracle: Get OSM price, medianizer price, next price
- Governance: Get proposals, vote, delegate MKR
- System: Get status, debt ceiling, total debt, surplus
- Analytics: Get TVL, DSR stats, vault stats
- Utility: Convert units, calculate ratios, estimate gas
- Triggers: DAI/MKR transfers, vault events, governance votes"

git remote add origin https://github.com/Velocity-BPA/n8n-nodes-maker.git
git branch -M main
git push -u origin main
```

## Update Existing Repository

```bash
# If repository already exists, use force push
git push -u origin main --force
```

## Create GitHub Repository First

1. Go to https://github.com/new
2. Repository name: `n8n-nodes-maker`
3. Description: `n8n community node for Maker/Sky Protocol - Complete DeFi toolkit`
4. Make it Public
5. Do NOT initialize with README (we have one)
6. Create repository
7. Run the push commands above
