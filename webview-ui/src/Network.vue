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
  ref,
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

const customNodeTarget = ref("");
const customNode = reactive({
  name: "",
  url: "",
  network: ViteNetwork.DebugNet,
  type: "remote",
});

function show(target: string, event: any) {
  event.preventDefault();
  customNodeTarget.value = target;
}

function hide(){
  customNodeTarget.value = "";
}

function saveNode(){
  vscode.postMessage({
    command: "saveCustomNode",
    message: {
      node: Object.assign({}, customNode),
      target: customNodeTarget.value,
    }
  });
  hide();
}
function deleteNode(node: ViteNode) {
  state.nodesMap.delete(node.name);
  const copyNode = Object.assign({}, node);
  delete copyNode.info;
  vscode.postMessage({
    command: "deleteCustomNode",
    message: {
      node: copyNode,
    },
  });
}
function getNodesListByNetwork(network: ViteNetwork) {
  const nodesList = Array.from(state.nodesMap.values())
    .filter(node => node.network === network);
  return nodesList;
}
function getNodeError(node: ViteNode) {
  if (typeof node.error === "object") {
    return JSON.stringify(node.error);
  } else {
    return node.error;
  }
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
    <section class="component-container nodes-list" v-for="(network, idx) in ViteNetwork" :key="idx">
      <vscode-tag>{{ network }}</vscode-tag>
      <div class="component-item" v-for="(node, i) in getNodesListByNetwork(network)" :key="i">
        <p class="node-url">
          <span>{{node.name.slice(0,1).toUpperCase()}}{{node.name.slice(1)}}: {{ node.url }}</span>
          <vscode-link v-if="!node.isDefault" @click="deleteNode(node)" title="Delete Vite Node">Delete</vscode-link>
        </p>
        <p>Status: {{ node.status }}</p>
        <p v-if="node.info?.snapshotChainHeight">Snapshot height: {{ node.info?.snapshotChainHeight }}</p>
        <p v-if="node.error" :title="getNodeError(node)">Error: {{ getNodeError(node) }}</p>
        <vscode-button appearance="secondary" v-if="node.error && node.name != 'local'" @click="reconnect(node)">Reconnect</vscode-button>
        <vscode-divider></vscode-divider>
      </div>
    </section>
    <section v-if="customNodeTarget" class="component-container">
      <div class="component-item">
        <vscode-dropdown @change="customNode.network = $event.target.value" title="custom node network">
          <vscode-option v-for="(network, idx) in ViteNetwork" :key="idx" :value="network">Node Network: {{ network }}</vscode-option>
        </vscode-dropdown>
      </div>
      <div class="component-item">
        <vscode-text-field @input="customNode.name = $event.target.value" :value="customNode.name"
          placeholder="Node Name" title="custom node name"></vscode-text-field>
      </div>
      <div class="component-item">
        <vscode-text-field size="50" @input="customNode.url = $event.target.value" :value="customNode.url"
         placeholder="Node URL" title="custom node url">
        </vscode-text-field>
      </div>
      <div class="component-item button-group">
        <vscode-button appearance="secondary" @click="hide()">Close</vscode-button>
        <vscode-button @click="saveNode()">Save to {{customNodeTarget }}</vscode-button>
      </div>
    </section>
    <section class="component-container">
      <div class="component-item links">
        Add a custom node in the
        <vscode-link href="#" @click="show('Global', $event)">Global</vscode-link>
        or
        <vscode-link href="#" @click="show('Workspace', $event)">Workspace</vscode-link>
        settings.
      </div>
    </section>
  </main>
</template>

<style>
.component-container {
  display: grid;
  grid-template-columns: 1fr;
  margin: .5rem 0;
}

.component-item {
  margin-top: 0.5rem;
}

.nodes-list vscode-tag {
  margin-bottom: 0.22rem;
}

.nodes-list .component-item {
  display: grid;
  grid-template-columns: auto;
  margin-top: 0;
}

.nodes-list p{
  color: var(--vscode-foreground);
  padding: 0 3px;
  margin: 0;
  cursor: pointer;
  line-height: 1.2rem;
  white-space: nowrap;
  overflow: hidden;
}

.nodes-list p:hover{
  background-color: var(--list-hover-background);
}

.nodes-list .component-item:last-child vscode-divider {
  display: none;
}

.button-group{
  margin-top: .5rem;
  display: flex;
  column-gap: 0.5rem;
  row-gap: 0.5rem;
  flex-wrap: wrap;
}

.links {
  color: var(--vscode-foreground);
}
.node-url {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.node-url vscode-link {
  display: none;
}

.node-url:hover vscode-link{
  display: inline;
}
</style>
