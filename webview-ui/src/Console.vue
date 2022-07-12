<script setup lang="ts">
import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeTextField,
  vsCodeDropdown,
  vsCodeOption,
  vsCodePanels,
  vsCodePanelTab,
  vsCodePanelView,
  vsCodeDivider,
} from "@vscode/webview-ui-toolkit";
import {
  reactive,
  onMounted,
  watchEffect,
} from "vue";
import { vscode } from "./vscode";
import type { ABIItem, DeployInfo, Address } from "./types";
import Ctor from "./components/Ctor.vue";
import Func from "./components/Func.vue";
import Event from "./components/Event.vue";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTextField(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodePanels(),
  vsCodePanelTab(),
  vsCodePanelView(),
  vsCodeDivider(),
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
const deployedSet: Set<Address> = new Set();
const addressMap: Map<Address, any> = new Map();

const state = reactive({
  currentNetwork: "",
  deployedList: [] as DeployInfo[],
  selectedAddress: "",
  selectedAddressInfo: {} as any,
  addressMap,
  activeTab: "tab-0",
  viewStyle: "TAB",
});

function dataReceiver (ev: any) {
  const data = ev.data
  switch (data.command) {
    case "viewStyle":
      state.viewStyle = data.message;
      break;
    case "pushContract":
      {
        const deployInfo = data.message;
        if (state.currentNetwork !== deployInfo.network) {
          clear();
          state.currentNetwork = data.message.network;
        }
        if (deployedSet.has(deployInfo.address)) {
          const idx = state.deployedList.findIndex(item => item.address === deployInfo.address);
          state.activeTab = `tab-${idx}`;
        } else {
          deployedSet.add(deployInfo.address);
          state.deployedList = [deployInfo, ...state.deployedList];
        }
      }
      break;
    case "setAddressList":
      {
        for (const item of data.message) {
          state.addressMap.set(item.address, item);
          if (state.selectedAddress === item.address) {
            state.selectedAddressInfo = item;
          }
        }
        if (!state.selectedAddress) {
          state.selectedAddress = data.message[0].address;
          state.selectedAddressInfo = data.message[0];
        }
      }
      break;
    case "clear":
      clear();
      break;
    case "queryResult":
      {
        const { ret, func, contractAddress } = data.message;
        const contract: any = state.deployedList.find(item => item.address === contractAddress);
        for (const abi of contract.abi) {
          if (abi.name === func.name && abi.type === func.type && abi.stateMutability === func.stateMutability) {
            abi.outputs.forEach((output:any, idx:number) => {
              output.value = ret[idx];
            });
          }
        }
      }
      break;
    case "eventResult":
      {
        const { ret, event, contractAddress } = data.message;
        const contract: any = state.deployedList.find(item => item.address === contractAddress);
        for (const abi of contract.abi) {
          if (abi.name === event.name && abi.type === event.type) {
            abi.inputs.forEach((input:any, idx:number) => {
              input.value = ret[idx];
            });
          }
        }
      }
      break;
    case "callResult":
      {
        const { sendBlock, func, contractAddress } = data.message;
        const contract: any = state.deployedList.find(item => item.address === contractAddress);
        for (const abi of contract.abi) {
          if (abi.name === func.name && abi.type === func.type && abi.stateMutability === func.stateMutability) {
            abi.confirmedHash = sendBlock.confirmedHash;
          }
        }
      }
      break;
  }
}

function clear() {
  state.activeTab = "tab-0";
  state.deployedList = [];
  deployedSet.clear();
  state.addressMap.clear();
  state.selectedAddress = "";
}

watchEffect(() => {
  if (state.currentNetwork) {
    vscode.postMessage({
      command: "getAddressList",
      message: state.currentNetwork,
    });
  }
})

function changeAddress(addr: Address) {
  state.selectedAddress = addr;
  state.selectedAddressInfo = addressMap.get(addr);
}

function getCtorDeclarations(abi: ABIItem[]): ABIItem[] {
  return abi.filter((x: any) => x.type === "constructor" && x.stateMutability === "payable");
}

function getFuncDeclarations(abi: ABIItem[]): ABIItem[]  {
  return abi.filter((x: any) => x.type === "function");
}

function getEventDeclarations(abi: ABIItem[]): ABIItem[]  {
  return abi.filter((x: any) => x.type === "event");
}

function send(ctor: ABIItem, info: DeployInfo) {
  vscode.postMessage({
    command: "send",
    message: {
      fromAddress: state.selectedAddress,
      toAddress: info.address,
      network: info.network,
      ctor: JSON.parse(JSON.stringify(ctor)),
      contractFile: {
        fragment: info.contractName,
        fsPath: info.contractFsPath,
      },
    }
  });
}

function query(func: ABIItem, info: DeployInfo) {
  vscode.postMessage({
    command: "query",
    message: {
      fromAddress: state.selectedAddress,
      toAddress: info.address,
      network: info.network,
      contractFile: {
        fragment: info.contractName,
        fsPath: info.contractFsPath,
      },
      func: JSON.parse(JSON.stringify(func)),
    },
  });
}

function call(func: ABIItem, info: DeployInfo) {
  vscode.postMessage({
    command: "call",
    message: {
      fromAddress: state.selectedAddress,
      toAddress: info.address,
      network: info.network,
      contractFile: {
        fragment: info.contractName,
        fsPath: info.contractFsPath,
      },
      func: JSON.parse(JSON.stringify(func)),
    },
  });
}

</script>

<template>
  <main>
    <section class="component-container selected-address">
      <p>Select an address to interact with a contract</p>
      <vscode-dropdown @change="changeAddress($event.target.value)">
        <vscode-option v-for="item in state.addressMap.values()" :value="item.address">
          {{ item.address }}
        </vscode-option>
      </vscode-dropdown>
      <p>Balance: {{ state.selectedAddressInfo.balance }}, Quota: {{ state.selectedAddressInfo.quota }}</p>
    </section>
    <!-- viewStyle: Tab -->
    <vscode-panels :activeid="state.activeTab" v-if="state.viewStyle==='Tab'">
      <vscode-panel-tab :id="'tab-' + idx" v-for="(deployInfo, idx) in state.deployedList">
        {{ deployInfo.contractName }}
      </vscode-panel-tab>
      <vscode-panel-view :id="'view-' + idx" v-for="(item, idx) in state.deployedList">
        <div class="is-grid">
          <p class="contract-status">
            Contract
            <span class="highlight">{{ item.contractName }}</span>
            deployed at
            <span class="highlight">{{ item.address }}</span>
            on
            <span class="highlight">{{ item.network }}</span>
            network
          </p>

          <Ctor v-for="ctor in getCtorDeclarations(item.abi)" :ctor="ctor" @send="send(ctor, item)"></Ctor>
          <Func v-for="(func, idx) in getFuncDeclarations(item.abi)" :func="func" :key="idx" @call="call(func, item)" @query="query(func, item)"></Func>
          <Event v-for="(event, idx) in getEventDeclarations(item.abi)" :event="event" :key="idx" ></Event>

        </div>
      </vscode-panel-view>
    </vscode-panels>
    <!-- viewStyle: Flow -->
    <section class="flow" v-else v-for="item in state.deployedList">
      <p class="contract-status">
        <span class="highlight">{{ item.contractName }}</span>
        deployed at
        <span class="highlight">{{ item.address }}</span>
        on
        <span class="highlight">{{ item.network }}</span>
        network
      </p>

      <Ctor v-for="ctor in getCtorDeclarations(item.abi)" :ctor="ctor" @send="send(ctor, item)"></Ctor>
      <Func v-for="(func, idx) in getFuncDeclarations(item.abi)" :func="func" :key="idx" @call="call(func, item)" @query="query(func, item)"></Func>
      <Event v-for="(event, idx) in getEventDeclarations(item.abi)" :event="event" :key="idx" ></Event>

      <vscode-divider></vscode-divider>
    </section>
  </main>
</template>

<style>
main{
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
  margin-left: 1rem;
  margin-right: 1rem;
}

vscode-panel-tab {
  font-size: 18px
}
vscode-panel-view {
  padding-left: 0;
  padding-right: 0;
}
.is-grid {
  display: grid;
  width: 100%;
}

.contract-status {
  margin-top: .5rem;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size);
}

.contract-status .highlight {
  color: #007aff;
}

.component-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  margin: 1rem 0;
  padding: 1rem;
  border: 1px dashed #007aff;
  border-radius: 5px;
}

.component-container h2{
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
  color: var(--vscode-foreground);
}

.component-item {
  margin-bottom: 0.5rem;
  width: 100%;
  display: flex;
  column-gap: 0.6rem;
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
}

.component-item .append{
  align-self: end;
}

vscode-text-field,
vscode-button{
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
}

.selected-address p{
  font-family: var(--vscode-editor-font-family);
  color: var(--vscode-foreground);
  margin: 0;
}
.selected-address vscode-option{
  font-family: var(--vscode-editor-font-family);
}
.selected-address vscode-dropdown{
  margin: 0.5rem 0;
}

.flow{
  margin-top: 1rem;
}

.flow:last-child vscode-divider{
  display: none;
}
.get-past-events{
  margin-bottom: 1rem;
}
</style>