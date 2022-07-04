<script setup lang="ts">
import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeDropdown,
  vsCodeOption,
  vsCodeTag,
  vsCodeTextField,
  vsCodeLink,
  vsCodeDivider,
} from "@vscode/webview-ui-toolkit";
import {
  reactive,
  onMounted,
  computed,
} from "vue";
import { ViteNodeStatus, type ViteNode, ViteNetwork } from "./types";
import { vscode } from "./vscode";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodeTag(),
  vsCodeTextField(),
  vsCodeLink(),
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

const nodesMap: Map<string, ViteNode> = new Map();
const state = reactive({
  nodesMap,
});
const customNode = reactive({
  name: "custom",
  url: "",
  network: ViteNetwork.Debug,
  target: "",
});

function dataReceiver (ev: any) {
  const data = ev.data
  switch (data.command) {
    case "setViteNode":
      {
        const { viteNodesList } = data.message;
        for (const item of viteNodesList) {
          state.nodesMap.set(item.name, item);
        }
      }
      break;
    case "updateViteNode":
      {
        const node = data.message as ViteNode;
        state.nodesMap.set(node.name, data.message);
      }
      break;
    case "updateSnapshotChainHeight":
      {
        const { nodeName, height } = data.message;
        const node = nodesMap.get(nodeName) as ViteNode;
        node.info = {
          ...node.info,
          snapshotChainHeight: height,
        };
        state.nodesMap.set(node.name, {...node});
      }
      break;
  }
}

const isLocalNodeLive = computed(() => {
  const node = state.nodesMap.get("local");
  return node?.status === ViteNodeStatus.Running || node?.status === ViteNodeStatus.Syncing;
});

function startLocalViteNode () {
  vscode.postMessage({
    command: "startLocalViteNode",
  });
}
function stopLocalViteNode () {
  vscode.postMessage({
    command: "stopLocalViteNode",
  });
}
function reconnect(node: ViteNode) {
  delete node.error;
  node.status = ViteNodeStatus.Syncing;
  vscode.postMessage({
    command: "reconnect",
    message: {
      name: node.name
    },
  });
}
function show(target: string) {
  customNode.target = target;
}
function hide(){
  customNode.target = "";
}
function save(){
  vscode.postMessage({
    command: "saveCustomNode",
    message: {
      name: customNode.name,
      url: customNode.url,
      network: customNode.network,
      target: customNode.target,
    },
  });
  customNode.target = "";
}
function getNodesListByNetwork(network: ViteNetwork) {
  const nodesList = Array.from(state.nodesMap.values())
    .filter(node => node.network === network);
  return nodesList;
}
</script>

<template>
  <main>
    <section class="component-container">
      <vscode-button v-if="isLocalNodeLive" @click="stopLocalViteNode">
        Stop Local Node
        <span slot="start" class="codicon codicon-debug-pause"></span>
      </vscode-button>
      <vscode-button v-else @click="startLocalViteNode">
        Start Local Node
        <span slot="start" class="codicon codicon-debug-start"></span>
      </vscode-button>
    </section>
    <template v-for="network in ViteNetwork">
      <section class="component-container node-list">
        <vscode-tag>{{ network }}</vscode-tag>
        <div class="component-item" v-for="(node, idx) in getNodesListByNetwork(network)">
          <vscode-option>{{node.name.slice(0,1).toUpperCase()}}{{node.name.slice(1)}}: {{ node.url }}</vscode-option>
          <vscode-option>Status: {{ node.status }}</vscode-option>
          <vscode-option v-show="node.info?.snapshotChainHeight">Snapshot height: {{ node.info?.snapshotChainHeight }}
          </vscode-option>
          <vscode-option v-show="node.error">Error: {{ node.error }}</vscode-option>
          <vscode-button v-show="node.error && node.name != 'local'" @click="reconnect(node)">Reconnect</vscode-button>
          <vscode-divider></vscode-divider>
        </div>
      </section>
    </template>
    <section class="component-container">
      <div class="component-item">
        Add a custom node in the
        <vscode-link href="#" @click="show('Global')">Global</vscode-link>
        or
        <vscode-link href="#" @click="show('Workspace')">Workspace</vscode-link>
        settings
      </div>
    </section>
    <section v-if="customNode.target" class="component-container">
      <div class="component-item">
        <vscode-dropdown @change="customNode.network = $event.target.value">
          <vscode-option v-for="network in ViteNetwork" :value="network">{{ network }}</vscode-option>
        </vscode-dropdown>
      </div>
      <div class="component-item">
        <vscode-text-field @input="customNode.name = $event.target.value" :value="customNode.name"
          placeholder="Node Name"></vscode-text-field>
      </div>
      <div class="component-item">
        <vscode-text-field size="50" @input="customNode.url = $event.target.value" :value="customNode.url" placeholder="Node URL">
        </vscode-text-field>
      </div>
      <div class="component-item button-group">
        <vscode-button appearance="secondary" @click="hide()">Hide</vscode-button>
        <vscode-button @click="save()">Save to {{customNode.target }}</vscode-button>
      </div>
    </section>
  </main>
</template>

<style>
.component-container {
  display: grid;
  grid-template-columns: 1fr;
  margin-top: .5rem;
}
.component-item {
  margin-bottom: 0.5rem;
}
.node-list .component-item {
  display: grid;
  grid-template-columns: 1fr;
}
.node-list .component-item:last-child vscode-divider {
  display: none;
}

vscode-tag .control{
  background-color: var(--vscode-list-hover-background);
}
.button-group{
  margin-top: .5rem;
  display: flex;
  column-gap: 0.5rem;
  row-gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
