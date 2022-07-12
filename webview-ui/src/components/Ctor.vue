<script setup lang="ts">
import { Vite_TokenId, type ABIItem} from "../types";

interface Props {
  ctor: ABIItem
};

const { ctor } = defineProps<Props>();
const emit = defineEmits(["send"]);

function ctorSignature(f: ABIItem): string {
  const name = f.name ?? "constructor";
  const params = f.inputs?.map(x => `${x.type} ${x.name}`).join(", ")

  return `${name}(${params}) ${f.stateMutability}`;
}
</script>

<template>
  <section class="component-container">
    <h2>{{ ctorSignature(ctor) }}</h2>

    <div class="component-item">
      <vscode-text-field size="50" :value="Vite_TokenId">token id</vscode-text-field>
    </div>
    <div class="component-item">
      <vscode-text-field size="50" @input="ctor.amount = $event.target.value" vaule="">
        amount
      </vscode-text-field>
    </div>
    <div class="component-item">
      <vscode-button class="btn-primary" @click="emit('send')">send()</vscode-button>
    </div>
    <div class="component-item">
      Send token to this contract
    </div>
  </section>
</template>
