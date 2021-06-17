# Soliditypp extension for Visual Studio Code

[Soliditypp](https://marketplace.visualstudio.com/items?itemName=ViteLabs.soliditypp) is the smart contract programming language used in Vite. Vite is a DAG-based, asynchronous, high-performance and fee-less dApp platform where transactions can be executed quickly and confirmed in seconds. The extension contains following features:

## Features
* Syntax highlighting
* Code completion
* Auto compilation when saving the contract
* Compilation error highlighting
* Detailed error message displaying when mouse over 
* One-click smart contract deployment and debugging
* Support for multiple smart contracts
* Deployment / debugging result displaying
* Support for offchain querying
* Support import mnemonics
* Support to call contract and create contract by vc connect
* Support deploy contract and call contract on testnet and mainnet
* Support call any contract on mainnet
* Examples

## Tutorial
See the [Vite Wiki](https://vite.wiki/tutorial/contract/debug.html) for details.


## Publish

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

```
# Bump package version
npm version patch

# Publish to VC marketplace
vsce publish
```