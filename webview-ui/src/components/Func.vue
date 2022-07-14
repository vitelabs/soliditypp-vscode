<script setup lang="ts">
import type { ABIItem } from "../types";

interface Props {
  func: ABIItem
};

const { func } = defineProps<Props>();
const emit = defineEmits(["query", "call"]);

function funcSignature(f: ABIItem): string {
  const name = f.name ?? "";
  const params = f.inputs?.map(x => `${x.type} ${x.name}`).join(", ")

  return `function ${name}(${params}) ${f.stateMutability}`;
}

</script>

<template>
  <section class="component-container">
    <h2>{{ funcSignature(func) }}</h2>

    <div class="component-item" v-if="func.stateMutability==='payable'">
      <vscode-text-field size="46" @input="func.amount = $event.target.value" value="">amount</vscode-text-field>
      <vscode-dropdown class="append" @change="func.amountUnit = $event.target.value">
        <vscode-option v-for="(unit, idx) in ['vite', 'attov']" :key="idx" :value="unit">{{ unit }}</vscode-option>
      </vscode-dropdown>
    </div>

    <div class="component-item" v-for="(input, i) in func.inputs" :key="i">
      <vscode-text-field size="60" @input="input.value = $event.target.value" :value="input.value">
        {{ input.name }}: {{ input.type }}
      </vscode-text-field>
    </div>

    <div class="component-item">
      <vscode-button @click="emit('query')" v-if="func.stateMutability === 'view' || func.stateMutability === 'pure'">
        query {{ func.name }}()
      </vscode-button>
      <vscode-button @click="emit('call')" v-else>
        call {{func.name}}()
      </vscode-button>
    </div>

    <div class="component-item" v-if="func.confirmedHash">
      <strong>confirmed hash:</strong> {{func.confirmedHash}}
    </div>

    <div class="component-item" v-if="func.outputs?.find(x => x.value)" v-for="(output, idx) in func.outputs"
      :key="idx">
      <strong>{{output.type}} {{output.name}}:</strong> {{output.value}}
    </div>
  </section>
</template>
