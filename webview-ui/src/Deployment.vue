<script setup lang="ts">
import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeOption,
  vsCodeTag,
  vsCodeDropdown,
  vsCodeTextField,
} from "@vscode/webview-ui-toolkit";
import {
  reactive,
  onMounted,
  watchEffect,
} from "vue";
import type { ViteNode } from "./types";
import { vscode } from "./vscode";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeOption(),
  vsCodeTag(),
  vsCodeDropdown(),
  vsCodeTextField(),
);

onMounted(()=>{
  vscode.postMessage({
    command: "mounted"
  });
});

window.addEventListener("message", dataReceiver);
window.addEventListener("unload", ()=>{
  window.removeEventListener("message", dataReceiver);
});

// state
const state = reactive({
  selectedNodeIdx: 0,
  nodesList: [] as ViteNode[],
  selectedAddress: "",
  addressesList: [],
  selectedContractIdx: 0,
  contractsList: [] as any[],
});

const params = reactive({
  amount: 0,
  unit: "vite",
  responseLatency: 0,
  quotaMultiplier: 100,
  randomDegree: 0,
});

function dataReceiver (ev: any) {
  const data = ev.data
  switch (data.command) {
    case "updateContractsList": 
      {
        state.contractsList = data.message as [];
        // state.selectedContract = state.contractsList[0];
      }
      break;
    case "updateDeps":
      {
        const {nodesList, addressesList} = data.message;
        if (nodesList) {
          state.nodesList = nodesList;
          // state.selectedNode = state.nodesList[0];
        }
        if (addressesList) {
          state.addressesList = addressesList;
          state.selectedAddress = state.addressesList[0];
        }
      }
      break;
  }
}

watchEffect(() => {
  const node = state.nodesList[state.selectedNodeIdx];
  if (node) {
    vscode.postMessage({
      command: "changeNetwork",
      message: node.network,
    });
  }
});

function deployContract() {
  vscode.postMessage({
    command: "deployContract",
    message: {
      selectedNode: Object.assign({}, state.nodesList[state.selectedNodeIdx]),
      selectedAddress: state.selectedAddress,
      selectedContract: Object.assign({}, state.contractsList[state.selectedContractIdx]),
      params: Object.assign({}, params),
    }
  });
}
</script>

<template>
  <main>
    <section class="component-container">
      <div class="component-item">
        <vscode-text-field
          title="The amount of vite token is transferred by send create block which is used to create a contract. The basic unit of token is vite, the smallest unit is attov, 1 vite = 1e18 attov"
          @input="params.amount = $event.target.value" :value="params.amount">Amount</vscode-text-field>
        <vscode-dropdown class="append" @change="params.unit = $event.target.value">
          <vscode-option v-for="unit in ['vite', 'attov']" :value="unit">{{unit}}</vscode-option>
        </vscode-dropdown>
      </div>
      <vscode-text-field class="input-item" @input="params.responseLatency = $event.target.value" title="" :value="params.responseLatency">
        Response Latency Time</vscode-text-field>
      <vscode-text-field class="input-item" @input="params.quotaMultiplier = $event.target.value" :value="params.quotaMultiplier">Quota
        Multiplier</vscode-text-field>
      <vscode-text-field @input="params.randomDegree = $event.target.value" :value="params.randomDegree">Random Degree
      </vscode-text-field>
    </section>
    <section class="component-container">
      <label class="dropdown-title">Select Network & Node</label>
      <vscode-dropdown @change="state.selectedNodeIdx = $event.target.value" position="above">
        <vscode-option v-for="(node, idx) in state.nodesList" :value="idx">{{ node.network }} {{ node.url }}</vscode-option>
      </vscode-dropdown>
    </section>
    <section class="component-container">
      <label class="dropdown-title">Select Address</label>
      <vscode-dropdown @change="state.selectedAddress = $event.target.value">
        <vscode-option v-for="addr in state.addressesList" :value="addr">{{ addr }}</vscode-option>
      </vscode-dropdown>
    </section>
    <section class="component-container">
      <label class="dropdown-title">Select Contract</label>
      <vscode-dropdown @change="state.selectedContractIdx = $event.target.value">
        <vscode-option v-for="(item, idx) in state.contractsList" :value="idx">{{ item.name }} {{ item.sourceFileName }}</vscode-option>
      </vscode-dropdown>
    </section>
    <section class="component-container">
      <vscode-button @click="deployContract">Deploy Contract</vscode-button>
    </section>
  </main>
</template>

<style>
.component-container {
  display: grid;
  margin-top: .5rem;
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

.input-item {
  margin-bottom: 0.5rem;
}

.dropdown-title {
  color: var(--vscode-foreground);
}
</style>
