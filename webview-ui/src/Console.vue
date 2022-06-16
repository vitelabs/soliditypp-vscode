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
        if (state.currentNetwork !== data.message.network) {
          clear();
          state.currentNetwork = data.message.network;
        }
        if (deployedSet.has(data.message.address)) {
          const idx = state.deployedList.findIndex(item => item.address === data.message.address);
          state.activeTab = `tab-${idx}`;
        } else {
          state.deployedList = [data.message, ...state.deployedList];
          deployedSet.add(data.message.address);
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
  state.addressMap.clear();
  state.selectedAddress = "";
  deployedSet.clear();
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
  console.log(JSON.stringify(func))
  console.log(typeof JSON.stringify(func))
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
    <section class="component-container">
      <label>Select an address to interact with a contract</label>
      <vscode-dropdown v-for="item in state.addressMap.values()" @change="changeAddress($event.target.value)">
        <vscode-option :value="item.address">{{ item.address }}</vscode-option>
      </vscode-dropdown>
      <p>Balance: {{ state.selectedAddressInfo.balance }}, Quota: {{ state.selectedAddressInfo.quota }}</p>
    </section>
    <vscode-panels :activeid="state.activeTab" v-if="state.viewStyle==='Tab'">
      <vscode-panel-tab :id="'tab-' + idx" v-for="(deployInfo, idx) in state.deployedList">
        {{ deployInfo.contractName }}
      </vscode-panel-tab>
      <vscode-panel-view :id="'view-' + idx" v-for="(item, idx) in state.deployedList">
        <div class="is-grid">
          <p class="contract-status">{{ item.contractName }} deployed at {{ item.address }} on {{
            item.network }} network</p>

          <section class="component-container" v-for="ctor in getCtorDeclarations(item.abi)">
            <h2>Send token to the contract</h2>
            <div class="component-item">
              <vscode-text-field size="50" @input="ctor.tokenId = $event.target.value" :value="Vite_TokenId">token id</vscode-text-field>
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
              <vscode-text-field size="50" @input="func.amount = $event.target.value" value="">amount
              </vscode-text-field>
              <vscode-dropdown class="append" @change="func.amountUnit = $event.target.value">
                <vscode-option v-for="unit in ['vite', 'attov']" :value="unit">{{unit}}</vscode-option>
              </vscode-dropdown>
            </div>

            <div class="component-item" v-for="(input, i) in func.inputs" :key="i">
              <vscode-text-field @input="input.value = $event.target.value" :value="input.value" size="50">
                {{input.name}} ({{input.type}})
              </vscode-text-field>
            </div>
            <div class="component-item" v-for="(output, i) in func.outputs" :key="i">
                {{output.value}}
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
          </section>
        </div>
      </vscode-panel-view>
    </vscode-panels>
    <section v-else v-for="item in state.deployedList">
      <p class="contract-status">{{ item.contractName }} deployed at {{ item.address }} on {{
        item.network }} network</p>

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
          <vscode-text-field size="50" @input="func.amount = $event.target.value" value="">amount</vscode-text-field>
          <vscode-dropdown class="append" @change="func.amountUnit = $event.target.value">
            <vscode-option v-for="unit in ['vite', 'attov']" :value="unit">{{unit}}</vscode-option>
          </vscode-dropdown>
        </div>

        <div class="component-item" v-for="(input, i) in func.inputs" :key="i">
          <vscode-text-field @input="input.value = $event.target.value" :value="input.value" size="50">
            {{input.name}} ({{input.type}})
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
      </section>
    </section>
  </main>
</template>

<style>
vscode-panel-tab {
  font-size: 18px
}
.is-grid {
  display: grid;
}

.contract-status{
  display: flex;
  column-gap: 1rem;
  margin: 1rem;
  color: #007aff;
  font-size: 1rem;
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

.component-container > * {
  margin: 0.25rem 0;
}
.component-container h2{
  font-size: 1rem;
}

.component-item {
  margin-bottom: 0.5rem;
  width: 100%;
  display: flex;
  column-gap: 0.5rem;
}

.component-item .append{
  align-self: end;
}
</style>