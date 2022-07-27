import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
import { Ctx, Cmd } from "./ctx";
import { Address, ViteNetwork } from "./types/types";
import { newAccount, getAmount } from "./util";

export function stake(ctx: Ctx): Cmd {
  return async () => {
    const networkStr = await vscode.window.showInputBox({
      value: ViteNetwork.TestNet,
      placeHolder: "Debug | TestNet | MainNet",
      prompt: "Enter the network, default is TestNet",
    });
    if (!networkStr) {
      return;
    }
    let network: ViteNetwork = ViteNetwork.TestNet;
    switch (networkStr?.toLowerCase()) {
      case "debug":
        network = ViteNetwork.Debug;
      break;
      case "testnet":
        network = ViteNetwork.TestNet;
      break;
      case "mainnet":
        network = ViteNetwork.MainNet;
      break;
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
      placeHolder: "Quota Beneficiary",
      prompt: "Enter the address to stake to",
    });
    if (!beneficiaryAddress) {
      return;
    };
    let amount = await vscode.window.showInputBox({
      value: "134",
      placeHolder: "The minimum staking amount is 134 VITE",
      prompt: "Enter the amount to stake, default is 134 VITE",
    });
    if (!amount) {
      return;
    };
    const fromAddressObj = ctx.getAddressObj(fromAddress);
    if (!fromAddressObj) {
      ctx.vmLog.error(`[${network}][stake]${fromAddress} is not found in the wallet`);
      return;
    }

    // get provider and operator
    const provider = ctx.getProviderByNetwork(network);
    const sender = newAccount(fromAddressObj, provider);
    ctx.vmLog.info(`[${network}][stake][request]`, {
      fromAddress,
      beneficiaryAddress,
      amount,
      network,
    });

    try {
      let sendBlock = sender.stakeForQuota({
        beneficiaryAddress,
        amount: getAmount(amount),
      });
      sendBlock = await sendBlock.autoSend();
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
