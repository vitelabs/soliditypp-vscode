import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
const vite = require("@vite/vitejs");
import { Ctx, Cmd } from "./ctx";
import { Address, ViteNetwork, DeployInfo } from "./types/types";
import { getAmount } from "./util";
import { ContractConsoleViewPanel } from "./view/contract_console";

export function stake(ctx: Ctx): Cmd {
  return async () => {
    let selectedNetwork: ViteNetwork | null = null;
    await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Debug | TestNet | MainNet",
      prompt: "Please input the network",
      validateInput: (value: string) => {
        if (value) {
          let found:any;
          for (const network of Object.values(ViteNetwork)) {
            found = network.match(new RegExp(value, "i"));
            if (found) {
              selectedNetwork = network;
              break;
            }
          }
          if (found) {
            return "";
          } else {
            return "Invalid network";
          }
        } else {
          return "";
        }
      }
    });
    if (!selectedNetwork) {
      return;
    }

    const fromAddress = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      value: ctx.getAddressList(selectedNetwork)[0],
      placeHolder: "Deduction Address",
      prompt: "Please input the address to stake from",
      validateInput: (value: string) => {
        if (vite.wallet.isValidAddress(value) !== 1) {
          return "Please input a valid address";
        } else {
          return "";
        }
      }
    });
    if (!fromAddress) {
      return;
    };
    const beneficiaryAddress: Address | undefined = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      value: ctx.getAddressList(selectedNetwork)[0],
      placeHolder: "Quota Beneficiary",
      prompt: "Input the address to stake to",
      validateInput: (value: string) => {
        if (vite.wallet.isValidAddress(value) !== 1) {
          return "Please input a valid address";
        } else {
          return "";
        }
      }
    });
    if (!beneficiaryAddress) {
      return;
    };
    let amount = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "The minimum staking amount is 134 VITE",
      prompt: "Input the amount to stake",
    });
    if (!amount) {
      return;
    };
    const fromAddressObj = ctx.getAddressObj(fromAddress);
    if (!fromAddressObj) {
      ctx.vmLog.error(`[${selectedNetwork}][stake]${fromAddress} is not found in the wallet`);
      return;
    }

    ctx.vmLog.info(`[${selectedNetwork}][stake][request]`, {
      fromAddress,
      beneficiaryAddress,
      amount,
      network: selectedNetwork,
    });
    // get provider and operator
    const provider = ctx.getProviderByNetwork(selectedNetwork);
    const sender = new vuilder.UserAccount(fromAddress);
    sender._setProvider(provider);
    sender.setPrivateKey(fromAddressObj.privateKey);
    let sendBlock = sender.stakeForQuota({
      beneficiaryAddress,
      amount: getAmount(amount),
    });

    let resend = false;
    try {
      sendBlock = await sendBlock.autoSendByPoW();
    } catch (error) {
      ctx.vmLog.error(`[${selectedNetwork}][stake][autoSendByPoW]`, error);
      resend = true;
    }

    try {
      if (resend) {
        sendBlock = await sendBlock.autoSend();
      }
      ctx.vmLog.info(`[${selectedNetwork}][stake][sendBlock=${sendBlock.hash}]`, sendBlock);

      // get account block
      await vuilder.utils.waitFor(async () => {
        const blocks = await provider.request("ledger_getAccountBlocksByAddress", fromAddress, 0, 3);
        for (const block of blocks) {
          if (block.previousHash === sendBlock.previousHash) {
            sendBlock = block;
            ctx.vmLog.info(`[${selectedNetwork}][stake][sendBlock=${sendBlock.hash}]`, sendBlock);
            return true;
          }
        }
        return false;
      });

      // waiting confirmed
      await vuilder.utils.waitFor(async () => {
        sendBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.hash);
        if (!sendBlock.confirmedHash || !sendBlock.receiveBlockHash) {
          return false;
        }
        ctx.vmLog.info(`[${selectedNetwork}][stake][sendBlock][confirmed=${sendBlock.confirmedHash}]`, sendBlock);
        return true;
      });

      // waiting confirmed
      await vuilder.utils.waitFor(async () => {
        // get receive block
        const receiveBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.receiveBlockHash);
        if (!receiveBlock.confirmedHash) {
          return false;
        }
        ctx.vmLog.info(`[${selectedNetwork}][stake][receiveBlock][confirmed=${receiveBlock.confirmedHash}]`, receiveBlock);
        return true;
      });
      // refresh Wallet
      await vscode.commands.executeCommand("soliditypp.refreshWallet");
    } catch (error: any) {
      ctx.vmLog.error(`[${selectedNetwork}][stake]`, error);
    }
  };
}

export function loadContract(ctx: Ctx): Cmd {
  return async () => {
    const contracts = [
      ...(await vscode.workspace.findFiles("**/*.sol", "**/node_modules/**")),
      ...(await vscode.workspace.findFiles("**/*.solpp", "**/node_modules/**")),
    ];
    let selectedContract: string = "";
    if (contracts.length > 0) {
      selectedContract = vscode.workspace.asRelativePath(contracts[0], false);
    }
    const contractFileStr = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      value: selectedContract,
      prompt: "Input the contract file path",
    });
    if (!contractFileStr) {
      return;
    }
    const contractFile = contracts.find((item: vscode.Uri) => {
      if (item.fsPath.match(new RegExp(contractFileStr, "i"))) {
        return true;
      } else {
        return false;
      }
    });
    if (!contractFile) {
      vscode.window.showErrorMessage(`Contract ${contractFileStr} is not found`);
      return;
    }

    const contractJsonFile = vscode.Uri.parse(`${contractFile.fsPath}.json`);
    try {
      const stat = await vscode.workspace.fs.stat(contractJsonFile)
    } catch (error) {
      vscode.window.showErrorMessage(`Contract ${contractFileStr} is not compiled`);
      return;
    }

    const ret: Uint8Array = await vscode.workspace.fs.readFile(contractJsonFile);
    const compileResult = JSON.parse(ret.toString());
    if (compileResult.errors) {
      vscode.window.showErrorMessage(`Contract ${contractFileStr} is compiled with errors`);
      return;
    }

    let selectedNetwork: ViteNetwork | null = null;
    await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Debug | TestNet | MainNet",
      prompt: "Please input the network",
      validateInput: (value: string) => {
        if (value) {
          let found:any;
          for (const network of Object.values(ViteNetwork)) {
            found = network.match(new RegExp(value, "i"));
            if (found) {
              selectedNetwork = network;
              break;
            }
          }
          if (found) {
            return "";
          } else {
            return "Invalid network";
          }
        } else {
          return "";
        }
      }
    });
    if (!selectedNetwork) {
      return;
    }

    const address = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      prompt: "Please input the contract address",
      validateInput: (value: string) => {
        if (vite.wallet.isValidAddress(value) !== 2) {
          return "Please input a valid address";
        } else {
          return "";
        }
      }
    });
    if (!address) {
      return;
    }
    for (const fileName in compileResult.contracts) {
      const contractObj = compileResult.contracts[fileName];
      for (const contractName in contractObj) {
        const contract = contractObj[contractName];
        const deployinfo: DeployInfo = {
          contractName,
          address,
          contractFsPath: contractJsonFile.fsPath,
          sourceFsPath: contractFile.fsPath,
          network: selectedNetwork,
          abi: contract.abi,
        };
        // render console webview
        ContractConsoleViewPanel.render(ctx, deployinfo);
      }
    }
  };
}