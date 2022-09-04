import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
const vite = require("@vite/vitejs");
import { Ctx, Cmd } from "./ctx";
import { Address, ViteNetwork } from "./types/types";
import { getAmount } from "./util";

export function stake(ctx: Ctx): Cmd {
  return async () => {
    const networkStr = await vscode.window.showInputBox({
      placeHolder: "Debug | TestNet | MainNet",
      prompt: "Enter the network, default is TestNet",
    });
    let network: ViteNetwork = ViteNetwork.TestNet;
    switch (networkStr?.toLowerCase()) {
      case "debug":
        network = ViteNetwork.DebugNet;
        break;
      case "testnet":
        network = ViteNetwork.TestNet;
        break;
      case "mainnet":
        network = ViteNetwork.MainNet;
        break;
      default:
        network = ViteNetwork.TestNet;
    }

    const fromAddress = await vscode.window.showInputBox({
      value: ctx.getAddressList(network)[0],
      placeHolder: "Deduction Address",
      prompt: "Enter the address to stake from",
    });
    if (!fromAddress) {
      return;
    };
    const beneficiaryAddress: Address | undefined = await vscode.window.showInputBox({
      value: ctx.getAddressList(network)[0],
      placeHolder: "Quota Beneficiary",
      prompt: "Enter the address to stake to",
    });
    if (!beneficiaryAddress) {
      return;
    };
    let amount = await vscode.window.showInputBox({
      placeHolder: "The minimum staking amount is 134 VITE",
      prompt: "Enter the amount to stake",
    });
    if (!amount) {
      return;
    };
    const fromAddressObj = ctx.getAddressObj(fromAddress);
    if (!fromAddressObj) {
      ctx.vmLog.error(`[${network}][stake]${fromAddress} is not found in the wallet`);
      return;
    }

    ctx.vmLog.info(`[${network}][stake][request]`, {
      fromAddress,
      beneficiaryAddress,
      amount,
      network,
    });
    // get provider and operator
    const provider = ctx.getProviderByNetwork(network);
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
      ctx.vmLog.error(`[${network}][stake][autoSendByPoW]`, error);
      resend = true;
    }

    try {
      if (resend) {
        sendBlock = await sendBlock.autoSend();
      }
      ctx.vmLog.info(`[${network}][stake][sendBlock=${sendBlock.hash}]`, sendBlock);

      // get account block
      await vuilder.utils.waitFor(async () => {
        const blocks = await provider.request("ledger_getAccountBlocksByAddress", fromAddress, 0, 3);
        for (const block of blocks) {
          if (block.previousHash === sendBlock.previousHash) {
            sendBlock = block;
            ctx.vmLog.info(`[${network}][stake][sendBlock=${sendBlock.hash}]`, sendBlock);
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
        ctx.vmLog.info(`[${network}][stake][sendBlock][confirmed=${sendBlock.confirmedHash}]`, sendBlock);
        return true;
      });

      // waiting confirmed
      await vuilder.utils.waitFor(async () => {
        // get receive block
        const receiveBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.receiveBlockHash);
        if (!receiveBlock.confirmedHash) {
          return false;
        }
        ctx.vmLog.info(`[${network}][stake][receiveBlock][confirmed=${receiveBlock.confirmedHash}]`, receiveBlock);
        return true;
      });
      // refresh Wallet
      await vscode.commands.executeCommand("soliditypp.refreshWallet");
    } catch (error: any) {
      ctx.vmLog.error(`[${network}][stake]`, error);
    }
  };
}