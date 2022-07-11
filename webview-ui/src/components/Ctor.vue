<script setup lang="ts">
import { Vite_TokenId, type ABIItem} from "../types";

interface Props {
  ctor: ABIItem
};

const { ctor } = defineProps<Props>();
const emit = defineEmits(["send"]);
</script>

<template>
  <section class="component-container">
    <h2>Send token to the contract</h2>
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
  </section>
</template>
