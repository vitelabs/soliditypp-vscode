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
} from "@vscode/webview-ui-toolkit";
import {
  ref,
  reactive,
  onMounted,
watchEffect,
} from "vue";

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
        const { address, network, balance, quota } = data.message;
        if (network === ViteNetwork.Debug) {
          state.debugAddressMap.set(address, {
            address,
            network,
            balance,
            quota,
          });
        } else if (network === ViteNetwork.TestNet) {
          state.testNetAddressMap.set(address, {
            address,
            network,
            balance,
            quota,
          });
        } else if (network === ViteNetwork.MainNet) {
          state.mainNetAddressMap.set(address, {
            address,
            network,
            balance,
            quota,
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
</script>

<template>
  <main>
    <section class="component-container">
      <div class="wallet-title">
        <vscode-tag>{{ ViteNetwork.Debug }}</vscode-tag>
        <vscode-button appearance="icon" aria-label="New Address" title="New Address" @click="deriveAddress(ViteNetwork.Debug)">
          <span class="codicon codicon-add"></span>
        </vscode-button>
      </div>
      <div class="address-info" v-for="(item, idx) in state.debugAddressMap.values()">
        <vscode-option title="Click to copy" @click="copyToClipboard(item.address)">
          <span class="address">{{ item.address }}</span>
          <span class="codicon codicon-copy" title="Copy"></span>
        </vscode-option>
        <vscode-option>Balance: {{ item.balance }} </vscode-option>
        <vscode-option>Quota: {{ item.quota }}</vscode-option>
        <vscode-divider v-if="idx !== state.testNetAddressMap.size - 1"></vscode-divider>
      </div>
    </section>

    <section class="component-container">
      <div class="wallet-title">
        <vscode-tag>{{ ViteNetwork.TestNet }}</vscode-tag>
        <vscode-button appearance="icon" aria-label="New Address" title="New Address" @click="deriveAddress(ViteNetwork.TestNet)">
          <span class="codicon codicon-add"></span>
        </vscode-button>
      </div>
      <div class="address-info" v-for="(item, idx) in state.testNetAddressMap.values()">
        <vscode-option title="Click to copy" @click="copyToClipboard(item.address)">
          <span class="address">{{ item.address }}</span>
          <span class="codicon codicon-copy" title="Copy"></span>
        </vscode-option>
        <vscode-option>Balance: {{ item.balance }} </vscode-option>
        <vscode-option>Quota: {{ item.quota }}</vscode-option>
        <vscode-divider v-if="idx !== state.testNetAddressMap.size - 1"></vscode-divider>
      </div>
    </section>

    <section class="component-container">
      <div class="wallet-title">
        <vscode-tag>{{ ViteNetwork.MainNet }}</vscode-tag>
        <vscode-button appearance="icon" aria-label="New Address" title="New Address" @click="deriveAddress(ViteNetwork.MainNet)">
          <span class="codicon codicon-add"></span>
        </vscode-button>
      </div>
      <div class="address-info" v-for="(item, idx) in state.mainNetAddressMap.values()">
        <vscode-option title="Click to copy" @click="copyToClipboard(item.address)">
          <span class="address">{{ item.address }}</span>
          <span class="codicon codicon-copy" title="Copy"></span>
        </vscode-option>
        <vscode-option>Balance: {{ item.balance }} </vscode-option>
        <vscode-option>Quota: {{ item.quota }}</vscode-option>
        <vscode-divider v-if="idx !== state.mainNetAddressMap.size - 1"></vscode-divider>
      </div>
    </section>

    <section class="component-container button-group">
      <!-- <vscode-button>ViteConnect</vscode-button>
      <vscode-button @click="handleClick(false)">Import</vscode-button>
      <vscode-button @click="handleClick(true)">Export</vscode-button> -->
      <div class="component-item">
        <vscode-link @click="handleClick(false)">Import</vscode-link>
        or 
        <vscode-link @click="handleClick(true)">Export</vscode-link>
        wallet mnemonic.
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
        <vscode-text-area rows="5" :value="state.mneonic"></vscode-text-area>
      </div>
      <div class="component-item button-group">
        <vscode-button appearance="secondary" @click="hide()">Hide</vscode-button>
        <vscode-button v-if="state.isExport" appearance="secondary" @click="renew()">Renew</vscode-button>
        <vscode-button v-if="state.isExport" @click="save()">Save</vscode-button>
      </div>
    </section>
  </main>
</template>

<style>
.component-container {
  margin-top: 0.5rem;
}

.component-item {
  margin-bottom: 0.5rem;
}

.wallet-title {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: .5rem;
  align-items: center;
  width: 100%;
  border-radius: 3px;
}

.address-info {
  display: grid;
  grid-template-columns: 1fr;
  word-break: break-all;
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
</style>