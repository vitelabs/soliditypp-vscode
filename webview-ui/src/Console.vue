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
} from "@vscode/webview-ui-toolkit";
import {
  reactive,
  onMounted,
watchEffect,
} from "vue";
import { vscode } from "./vscode";
import { Vite_TokenId, type ABIItem, type DeployInfo, type Address } from "./types";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTextField(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodePanels(),
  vsCodePanelTab(),
  vsCodePanelView(),
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

function funcSignature(f: ABIItem): string {
  const name = f.name ?? "constructor";
  const params = f.inputs?.map(x => x.type).join(", ")

  return `function ${name}(${params}) ${f.stateMutability}`;
}

function send(ctor: ABIItem, info: DeployInfo) {
  vscode.postMessage({
    command: "send",
    message: {
      fromAddress: state.selectedAddress,
      toAddress: info.address,
      network: info.network,
      ctor: JSON.parse(JSON.stringify(ctor)),
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

          <section class="component-container" v-for="ctor in getCtorDeclarations(item.abi)">
            <h2>Send token to the contract</h2>
            <div class="component-item">
              <vscode-text-field size="50" @input="ctor.tokenId = $event.target.value" :value="Vite_TokenId">token id
              </vscode-text-field>
            </div>
            <div class="component-item">
              <vscode-text-field size="50" @input="ctor.amount = $event.target.value" vaule="">amount
              </vscode-text-field>
            </div>
            <div class="component-item">
              <vscode-button class="btn-primary" @click="send(ctor, item)">send()</vscode-button>
            </div>
          </section>

          <section class="component-container" v-for="(func, idx) in getFuncDeclarations(item.abi)" :key="idx">
            <h2>{{ funcSignature(func) }}</h2>

            <div class="component-item" v-if="func.stateMutability==='payable'">
              <vscode-text-field size="46" @input="func.amount = $event.target.value" value="">amount
              </vscode-text-field>
              <vscode-dropdown class="append" @change="func.amountUnit = $event.target.value">
                <vscode-option v-for="unit in ['vite', 'attov']" :value="unit">{{unit}}</vscode-option>
              </vscode-dropdown>
            </div>

            <div class="component-item" v-for="(input, i) in func.inputs" :key="i">
              <vscode-text-field size="60" @input="input.value = $event.target.value" :value="input.value">
                {{input.name}}: {{input.type}}
              </vscode-text-field>
            </div>

            <div class="component-item">
              <vscode-button @click="query(func, item)"
                v-if="func.stateMutability === 'view' || func.stateMutability === 'pure'">
                query {{func.name}}()
              </vscode-button>
              <vscode-button @click="call(func, item)" v-else>
                call {{func.name}}()
              </vscode-button>
            </div>

            <div class="component-item" v-if="func.outputs?.find(x => x.value)" v-for="(output, idx) in func.outputs" :key="idx">
              <span v-if="output.value">
                <strong>{{idx}}:</strong> {{output.type}} {{output.value}}
              </span>
            </div>
          </section>
        </div>
      </vscode-panel-view>
    </vscode-panels>
    <!-- viewStyle: Flow -->
    <section v-else v-for="item in state.deployedList">
      <p class="contract-status">
        <span class="highlight">{{ item.contractName }}</span>
        deployed at
        <span class="highlight">{{ item.address }}</span>
        on
        <span class="highlight">{{ item.network }}</span>
        network
      </p>

      <section class="component-container" v-for="ctor in getCtorDeclarations(item.abi)">
        <h2>Send token to the contract</h2>
        <div class="component-item">
          <vscode-text-field size="50" :value="Vite_TokenId">token id</vscode-text-field>
        </div>
        <div class="component-item">
          <vscode-text-field size="50" @input="ctor.amount = $event.target.value" vaule="">amount
          </vscode-text-field>
        </div>
        <div class="component-item">
          <vscode-button class="btn-primary" @click="send(ctor, item)">send()</vscode-button>
        </div>
      </section>

      <section class="component-container" v-for="(func, idx) in getFuncDeclarations(item.abi)" :key="idx">
        <h2>{{ funcSignature(func) }}</h2>

        <div class="component-item" v-if="func.stateMutability==='payable'">
          <vscode-text-field size="46" @input="func.amount = $event.target.value" value="">amount</vscode-text-field>
          <vscode-dropdown class="append" @change="func.amountUnit = $event.target.value">
            <vscode-option v-for="unit in ['vite', 'attov']" :value="unit">{{unit}}</vscode-option>
          </vscode-dropdown>
        </div>

        <div class="component-item" v-for="(input, i) in func.inputs" :key="i">
          <vscode-text-field size="60" @input="input.value = $event.target.value" :value="input.value">
            {{input.name}}: {{input.type}}
          </vscode-text-field>
        </div>

        <div class="component-item">
          <vscode-button @click="query(func, item)"
            v-if="func.stateMutability === 'view' || func.stateMutability === 'pure'">
            query {{func.name}}()
          </vscode-button>
          <vscode-button @click="call(func, item)" v-else>
            call {{func.name}}()
          </vscode-button>
        </div>

        <div class="component-item" v-if="func.outputs?.find(x => x.value)" v-for="(output, idx) in func.outputs" :key="idx">
          <span v-if="output.value">
            <strong>{{idx}}:</strong> {{output.type}} {{output.value}}
          </span>
        </div>
      </section>
    </section>
  </main>
</template>

<style>
main{
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
}

vscode-panel-tab {
  font-size: 18px
}
.is-grid {
  display: grid;
  width: 100%;
}

.contract-status {
  margin: .5rem 1rem 0;
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
  margin: 1rem;
  padding: 1rem;
  border: 1px dashed #007aff;
  border-radius: 5px;
}

.component-container h2{
  font-family: var(--vscode-editor-font-family);
  font-weight: var(--vscode-editor-font-weight);
  font-size: var(--vscode-editor-font-size);
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
</style>