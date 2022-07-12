<script setup lang="ts">
import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeDropdown,
  vsCodeOption,
  vsCodeTag,
  vsCodeTextArea,
  vsCodeDivider,
  vsCodeLink,
  vsCodeTextField,
  vsCodeBadge,
} from "@vscode/webview-ui-toolkit";
import {
  ref,
  reactive,
  onMounted,
  watchEffect,
} from "vue";

import QRCode from 'qrcode';
import { vscode } from "./vscode";
import { type Address, ViteNetwork } from "./types";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodeTag(),
  vsCodeTextArea(),
  vsCodeDivider(),
  vsCodeLink(),
  vsCodeTextField(),
  vsCodeBadge(),
);

onMounted(()=>{
  vscode.postMessage({
    command: "mounted",
  });
});

window.addEventListener("message", dataReceiver)
window.addEventListener("unload", ()=>{
  window.removeEventListener("message", dataReceiver);
})

// state
const debugAddressMap: Map<string, any> = new Map();
const testNetAddressMap: Map<string, any> = new Map();
const mainNetAddressMap: Map<string, any> = new Map();

const state = reactive({
  debugAddressMap: debugAddressMap,
  testNetAddressMap: testNetAddressMap,
  mainNetAddressMap: mainNetAddressMap,
  showForm: false,
  isExport: false,
  mneonic: "",
});
const selectedNetwork = ref(ViteNetwork.Debug);
const addressMapObj = {
  [ViteNetwork.Debug]: state.debugAddressMap,
  [ViteNetwork.TestNet]: state.testNetAddressMap,
  [ViteNetwork.MainNet]: state.mainNetAddressMap,
}

function dataReceiver (ev: any) {
  const data = ev.data;
  switch (data.command) {
    case "setAddress": 
      {
        for (const item of data.message ?? []) {
          if (item.network === ViteNetwork.Debug) {
            state.debugAddressMap.clear();
            state.debugAddressMap.set(item.address, item);
          } else if (item.network === ViteNetwork.TestNet) {
            state.testNetAddressMap.clear();
            state.testNetAddressMap.set(item.address, item);
          } else if (item.network === ViteNetwork.MainNet) {
            state.mainNetAddressMap.clear();
            state.mainNetAddressMap.set(item.address, item);
          }
        }
      }
      break;
    case "addAddress": 
      {
        const { address, network } = data.message;
        if (network === ViteNetwork.Debug) {
          state.debugAddressMap.set(address, {
            address,
            network,
          });
        } else if (network === ViteNetwork.TestNet) {
          state.testNetAddressMap.set(address, {
            address,
            network,
          });
        } else if (network === ViteNetwork.MainNet) {
          state.mainNetAddressMap.set(address, {
            address,
            network,
          });
        }
      }
      break;
    case "setMnemonic": 
      {
        state.mneonic = data.message;
      }
      break;
    case "updateAddressInfo": 
      {
        const { address, network, balance, quota, unreceived } = data.message;
        if (network === ViteNetwork.Debug) {
          state.debugAddressMap.set(address, {
            address,
            network,
            balance,
            quota,
            unreceived,
          });
        } else if (network === ViteNetwork.TestNet) {
          state.testNetAddressMap.set(address, {
            address,
            network,
            balance,
            quota,
            unreceived,
          });
        } else if (network === ViteNetwork.MainNet) {
          state.mainNetAddressMap.set(address, {
            address,
            network,
            balance,
            quota,
            unreceived,
          });
        }
      }
      break;
  }
}

function deriveAddress(network: ViteNetwork) {
  if (network == ViteNetwork.Debug) {
    vscode.postMessage({
      command: "deriveAddress",
      message: {
        network,
        index: debugAddressMap.size,
      }
    })
  } else if (network == ViteNetwork.TestNet) {
    vscode.postMessage({
      command: "deriveAddress",
      message: {
        network,
        index: testNetAddressMap.size,
      }
    })
  } else if (network == ViteNetwork.MainNet) {
    vscode.postMessage({
      command: "deriveAddress",
      message: {
        network,
        index: mainNetAddressMap.size,
      }
    })
  }
}

watchEffect(()=>{
  if (state.isExport) {
    vscode.postMessage({
      command: "getMnemonic",
      message: {
        network: selectedNetwork.value
      },
    })
  }
})

function handleClick(isExport: boolean) {
  state.isExport = isExport;
  state.mneonic = "";
  state.showForm = true;
  if (isExport) {
    selectedNetwork.value = ViteNetwork.Debug;
    vscode.postMessage({
      command: "getMnemonic",
      message: {
        network: selectedNetwork.value
      },
    })
  } else {
    selectedNetwork.value = ViteNetwork.TestNet;
  }
}

function save() {
  vscode.postMessage({
    command: "setMnemonic",
    message: {
      network: selectedNetwork.value,
      mnemonic: state.mneonic,
    }
  });
  hide();
}

function renew() {
  vscode.postMessage({
    command: "renewWallet"
  })
}

function hide() {
  state.showForm = false;
  state.mneonic = "";
}

function copyToClipboard(address: Address) {
  vscode.postMessage({
    command: "copyToClipboard",
    message: address,
  })
}

const balanceAction = ref("");
function hideBalanceAction() {
  balanceAction.value = "";
}
const sendTokenParams = reactive({
  toAddress: "",
  amount: "",
});
function showSendToken(address: Address) {
  if (balanceAction.value == `send.${address}`) {
    balanceAction.value = "";
  } else {
    balanceAction.value = `send.${address}`
  }
  sendTokenParams.toAddress = "";
  sendTokenParams.amount = ""
}

const canvasEl:{[key: string]: any} = {};
const canvas = ref(canvasEl);
function showQR(address: Address) {
  if (balanceAction.value == `receive.${address}`) {
    balanceAction.value = "";
  } else {
    balanceAction.value = `receive.${address}`
  }
  QRCode.toCanvas(canvas.value[address], address, (error: any) => {
    if (error) console.error(error)
  })
}

function sendTx(address: Address, network: ViteNetwork) {
  vscode.postMessage({
    command: "sendTx",
    message: {
      fromAddress: address,
      toAddress: sendTokenParams.toAddress,
      amount: sendTokenParams.amount,
      network,
    }
  });
  hideBalanceAction();
}

function receiveTx(address: Address, network: ViteNetwork) {
  vscode.postMessage({
    command: "receiveTx",
    message: {
      address,
      network,
    }
  });
}
</script>

<template>
  <main>
    <section class="component-container" v-for="(addressMap, network) in addressMapObj">
      <div class="wallet-title">
        <vscode-tag>{{ network }}</vscode-tag>
        <vscode-button appearance="icon" aria-label="Derive Address" title="New Address" @click="deriveAddress(network)">
          <span class="codicon codicon-add"></span>
        </vscode-button>
      </div>
      <div class="address-info" v-for="(item, idx) in addressMap.values()">
        <p title="Click to copy" @click="copyToClipboard(item.address)">
          <span class="address">{{ item.address.slice(0,50) }}<strong>{{ item.address.slice(50) }}</strong></span>
          <span class="codicon codicon-copy" title="Copy"></span>
        </p>
        <p class="balance" v-if="item.balance">
          <span>
            Balance: {{ item.balance }}
            <vscode-badge v-if="item.unreceived" :title="item.unreceived + ' unreceived transactions'">{{ item.unreceived }}</vscode-badge>
          </span>
          <vscode-link v-if="network != ViteNetwork.Debug" @click="showQR(item.address)" title="Receive Token">Receive</vscode-link>
          <vscode-link @click="showSendToken(item.address)" title="Send Token">Send</vscode-link>
        </p>
        <p v-if="item.quota">Quota: {{ item.quota }}</p>
        <section class="qrcode" :class="{'show': balanceAction === `receive.${item.address}` }">
          <h3>Scan and send VITE</h3>
          <canvas :ref="el => { canvas[item.address] = el }"></canvas>
          <vscode-button appearance="secondary" @click="hideBalanceAction()">Close</vscode-button>
        </section>
        <section v-if="balanceAction === `send.${item.address}`">
          <div class="component-item">
            <vscode-text-field @input="sendTokenParams.amount = $event.target.value" placeholder="Amount"></vscode-text-field>
          </div>
          <div class="component-item">
            <vscode-text-field size="60" placeholder="Address"
              @input="sendTokenParams.toAddress = $event.target.value"
            ></vscode-text-field>
          </div>
          <div class="component-item button-group">
            <vscode-button appearance="secondary" @click="hideBalanceAction()">Close</vscode-button>
            <vscode-button @click="sendTx(item.address, network)">Send</vscode-button>
          </div>
        </section>
        <vscode-divider v-if="idx < addressMap.size - 1"></vscode-divider>
      </div>
    </section>

    <section v-if="state.showForm" class="component-container">
      <div class="component-item">
        <vscode-dropdown v-if="state.isExport" @change="selectedNetwork = $event.target.value">
          <vscode-option v-for="network in ViteNetwork" :value="network" :selected="network == ViteNetwork.TestNet">{{ network }} Wallet Mneonic</vscode-option>
        </vscode-dropdown>
        <vscode-dropdown v-else @change="selectedNetwork = $event.target.value">
          <vscode-option :value="ViteNetwork.TestNet" selected>{{ ViteNetwork.TestNet }} Wallet Mneonic</vscode-option>
          <vscode-option :value="ViteNetwork.MainNet">{{ ViteNetwork.MainNet }} Wallet Mneonic</vscode-option>
        </vscode-dropdown>
      </div>
      <div class="component-item">
        <vscode-text-area rows="5" @input="state.mneonic = $event.target.value" :value="state.mneonic"></vscode-text-area>
      </div>
      <div class="component-item button-group">
        <vscode-button appearance="secondary" @click="hide()">Close</vscode-button>
        <vscode-button v-if="!state.isExport" appearance="secondary" @click="renew()">Renew</vscode-button>
        <vscode-button v-if="!state.isExport" @click="save()">Save</vscode-button>
      </div>
    </section>

    <section class="component-container">
      <!-- <vscode-button>ViteConnect</vscode-button>
      <vscode-button @click="handleClick(false)">Import</vscode-button>
      <vscode-button @click="handleClick(true)">Export</vscode-button> -->
      <div class="component-item links">
        <vscode-link @click="handleClick(false)">Import</vscode-link>
        or
        <vscode-link @click="handleClick(true)">Export</vscode-link>
        wallet mnemonic.
      </div>
    </section>
  </main>
</template>

<style>
.component-container {
  margin: 0.5rem 0;
}

.component-item {
  margin-top: 0.5rem;
}

.wallet-title {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: .5rem;
  align-items: center;
  width: 100%;
  border-radius: 3px;
  margin-bottom: 0.22rem;
}

.address-info {
  display: grid;
  grid-template-columns: 1fr;
  word-break: break-all;
}

.address-info p{
  color: var(--vscode-foreground);
  padding: 0 3px;
  margin: 0;
  cursor: pointer;
  line-height: 1.2rem;
}

.address-info p:hover{
  background-color: var(--list-hover-background);
}

.address-info .balance {
  display: grid;
  grid-template-columns: 1fr auto auto;
  column-gap: .5rem;
  align-items: center;
}

.address-info .balance .codicon,
.address-info .balance vscode-link{
  display: none;
}

.address-info .balance:hover .codicon,
.address-info .balance:hover vscode-link{
  display: inline;
}

.address {
  white-space: break-spaces;
  font-family: var(--vscode-editor-font-family);
}

.codicon-copy {
  position: relative;
  top: .2rem;
  margin-left: .3rem;
}

.button-group{
  margin-top: .5rem;
  display: flex;
  column-gap: 0.5rem;
  row-gap: 0.5rem;
  flex-wrap: wrap;
}

vscode-text-area{
  width: 100%;
  max-width: 100%;
}
.links {
  color: var(--vscode-foreground);
}
.qrcode h3{
  margin: .5rem 0;
}
.qrcode canvas{
  display: block;
  margin-bottom: .5rem;
}
.qrcode{
  display: none;
  margin-left: 3px;
}
.qrcode.show{
  display: block;
 }

vscode-badge{
  transform: scale(0.8);
}
</style>