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
const bridgeAddressMap: Map<string, any> = new Map();

const state = reactive({
  debugAddressMap: debugAddressMap,
  testNetAddressMap: testNetAddressMap,
  mainNetAddressMap: mainNetAddressMap,
  bridgeAddressMap: bridgeAddressMap,
  showForm: false,
  isExport: false,
  mneonic: "",
  viteConnectUri: "",
});
const selectedNetwork = ref(ViteNetwork.DebugNet);
const addressMapObj = {
  [ViteNetwork.DebugNet]: state.debugAddressMap,
  [ViteNetwork.TestNet]: state.testNetAddressMap,
  [ViteNetwork.MainNet]: state.mainNetAddressMap,
  [ViteNetwork.Bridge]: state.bridgeAddressMap,
}
const viteConnectEl = ref();

function dataReceiver (ev: any) {
  const data = ev.data;
  switch (data.command) {
    case "setAddress": 
      {
        for (const item of data.message ?? []) {
          const m = addressMapObj[item.network as ViteNetwork];
          m.clear();
          for (const address of item.addressList) {
            m.set(address, {
              address,
              network: item.network,
            });
          }
        }
      }
      break;
    case "addAddress": 
      {
        const { address, network } = data.message;
        const m = addressMapObj[network as ViteNetwork];
        m.set(address, {
          address,
          network,
        });
      }
      break;
    case "setMnemonic": 
      {
        state.mneonic = data.message;
      }
      break;
    case "updateAddressInfo": 
      {
        const { address, network } = data.message;
        const m = addressMapObj[network as ViteNetwork];
        m.set(address, data.message);
      }
      break;
    case "setViteConnectUri": 
      {
        state.viteConnectUri = data.message;
        QRCode.toCanvas(viteConnectEl.value[0], data.message);
      }
      break;
  }
}

function deriveAddress(network: ViteNetwork) {
  if (network == ViteNetwork.DebugNet) {
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
    selectedNetwork.value = ViteNetwork.DebugNet;
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
function showSendToken(network:ViteNetwork, address: Address) {
  if (balanceAction.value == `${network}.send.${address}`) {
    balanceAction.value = "";
  } else {
    balanceAction.value = `${network}.send.${address}`;
  }
  sendTokenParams.toAddress = "";
  sendTokenParams.amount = ""
}

const canvasEl:{[key: string]: any} = {};
const canvas = ref(canvasEl);
function showQR(network: ViteNetwork, address: Address) {
  if (balanceAction.value == `${network}.receive.${address}`) {
    balanceAction.value = "";
  } else {
    balanceAction.value = `${network}.receive.${address}`
  }
  QRCode.toCanvas(canvas.value[`${network}.${address}`], address, (error: any) => {
    if (error) vscode.log.error(error);
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

function createSession() {
  vscode.postMessage({
    command: "createSession",
  });
}
function hideViteConnectQRcode() {
  state.viteConnectUri = "";
}
function killSession() {
  state.viteConnectUri = "";
  vscode.postMessage({
    command: "killSession",
  });
}
function changeBackendNetwork(network: ViteNetwork) {
  vscode.postMessage({
    command: "changeBackendNetwork",
    message: network,
  });
}
</script>

<template>
  <main>
    <section class="component-container" v-for="(addressMap, network) in addressMapObj" :key="network">
      <div class="wallet-title">
        <vscode-tag>{{ network }}</vscode-tag>
        <vscode-button v-if="network !== ViteNetwork.Bridge" appearance="icon" aria-label="Derive Address"
          title="New Address" @click="deriveAddress(network)">
          <span class="codicon codicon-add"></span>
        </vscode-button>
        <vscode-button v-else-if="state.bridgeAddressMap.size > 0" appearance="icon" aria-label="Sign Out"
          title="Sign Out" @click="killSession()">
          <span class="codicon codicon-sign-out"></span>
        </vscode-button>
      </div>
      <div v-if="network === ViteNetwork.Bridge">
        <section class="backend-network" v-show="state.bridgeAddressMap.size > 0 || state.viteConnectUri">
          <label>Select vite wallet node network</label>
          <vscode-dropdown @change="changeBackendNetwork($event.target.value)">
            <vscode-option :value="ViteNetwork.MainNet" selected>{{ ViteNetwork.MainNet }}</vscode-option>
            <vscode-option :value="ViteNetwork.TestNet">{{ ViteNetwork.TestNet }}</vscode-option>
          </vscode-dropdown>
        </section>
        <section v-show="state.bridgeAddressMap.size === 0">
          <div class="bridge-qrcode" v-show="state.viteConnectUri">
            <h3>Scan the QR code via Vite Wallet App</h3>
            <canvas ref="viteConnectEl"></canvas>
          </div>
          <vscode-button v-show="!state.viteConnectUri" @click="createSession()">Vite Connect</vscode-button>
          <vscode-button v-show="state.viteConnectUri" appearance="secondary" @click="hideViteConnectQRcode()">Close
          </vscode-button>
        </section>
      </div>
      <div class="address-info" v-for="(addressInfo, idx) in addressMap.values()" :key="idx">
        <p title="Click to copy" @click="copyToClipboard(addressInfo.address)">
          <span class="address">{{ addressInfo.address.slice(0,50) }}<strong>{{ addressInfo.address.slice(50)
              }}</strong></span>
          <span class="codicon codicon-copy" title="Copy"></span>
        </p>
        <p class="balance" v-if="addressInfo.balance">
          <span>
            Balance: {{ addressInfo.balance }}
            <!-- <vscode-badge v-if="addressInfo.unreceived" :title="addressInfo.unreceived + ' unreceived transactions'">{{ addressInfo.unreceived }}</vscode-badge> -->
          </span>
          <vscode-link v-if="network != ViteNetwork.DebugNet" @click="showQR(network, addressInfo.address)"
            title="Receive Token">
            Receive</vscode-link>
          <vscode-link @click="showSendToken(network, addressInfo.address)" title="Send Token">Send</vscode-link>
        </p>
        <p v-if="addressInfo.quota">Quota: {{ addressInfo.quota }}</p>
        <section class="qrcode" :class="{'show': balanceAction === `${network}.receive.${addressInfo.address}` }">
          <h3>Scan and send VITE</h3>
          <canvas :ref="el => { canvas[`${network}.${addressInfo.address}`] = el }"></canvas>
          <vscode-button appearance="secondary" @click="hideBalanceAction()">Close</vscode-button>
        </section>
        <section v-if="balanceAction === `${network}.send.${addressInfo.address}`">
          <div class="component-item">
            <vscode-text-field @input="sendTokenParams.amount = $event.target.value" placeholder="Amount">
            </vscode-text-field>
          </div>
          <div class="component-item">
            <vscode-text-field size="60" placeholder="Address" @input="sendTokenParams.toAddress = $event.target.value">
            </vscode-text-field>
          </div>
          <div class="component-item button-group">
            <vscode-button appearance="secondary" @click="hideBalanceAction()">Close</vscode-button>
            <vscode-button @click="sendTx(addressInfo.address, network)">Send</vscode-button>
          </div>
        </section>
        <vscode-divider v-if="idx < addressMap.size - 1"></vscode-divider>
      </div>
    </section>

    <section v-if="state.showForm" class="component-container">
      <div class="component-item">
        <vscode-dropdown v-if="state.isExport" @change="selectedNetwork = $event.target.value">
          <vscode-option :value="ViteNetwork.DebugNet">{{ ViteNetwork.DebugNet }} Wallet Mneonic</vscode-option>
          <vscode-option :value="ViteNetwork.TestNet" selected>{{ ViteNetwork.TestNet }} Wallet Mneonic</vscode-option>
          <vscode-option :value="ViteNetwork.MainNet">{{ ViteNetwork.MainNet }} Wallet Mneonic</vscode-option>
        </vscode-dropdown>
        <vscode-dropdown v-else @change="selectedNetwork = $event.target.value">
          <vscode-option :value="ViteNetwork.TestNet" selected>{{ ViteNetwork.TestNet }} Wallet Mneonic</vscode-option>
          <vscode-option :value="ViteNetwork.MainNet">{{ ViteNetwork.MainNet }} Wallet Mneonic</vscode-option>
        </vscode-dropdown>
      </div>
      <div class="component-item">
        <vscode-text-area rows="5" @input="state.mneonic = $event.target.value" :value="state.mneonic">
        </vscode-text-area>
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

.bridge-qrcode h3,
.qrcode h3{
  color: var(--vscode-foreground);
  font-weight: normal;
  margin: .5rem 0;
}

.bridge-qrcode canvas,
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
.backend-network label{
  color: var(--vscode-foreground);
  margin-right: .5rem;
  line-height: 1.65rem;
}
</style>