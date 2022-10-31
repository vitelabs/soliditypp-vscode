<script setup lang="ts">
import type { ABIItem } from "../types";

interface Props {
  event: ABIItem
};

const { event } = defineProps<Props>();

function eventSignature(f: ABIItem): string {
  const name = f.name ?? "";
  const params = f.inputs?.map(x => `${x.type} ${x.name}`).join(", ")

  return `${f.type} ${name}(${params})`;
}

</script>

<template>
  <section class="component-container">
    <h2>{{ eventSignature(event) }}</h2>

    <div class="component-item" v-if="event.inputs?.find(x => x.value)" v-for="(input, idx) in event.inputs" :key="idx">
      <strong>{{input.type}} {{input.name}}:</strong> {{input.value}}
    </div>
  </section>
</template>
