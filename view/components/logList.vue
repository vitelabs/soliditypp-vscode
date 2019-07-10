<template>
    <div class="terminal" ref="terminal">
        <div class="log-item" v-for="(log, index) in deployInfo.logs" :key="index">
            <log-item :log="log"></log-item>
        </div>
    </div>
</template>

<script>
import logItem from './logItem';

export default {
    props: ['deployInfo'],

    components: {
        logItem
    },
    watch: {
        'deployInfo.logs': function() {
            if (this.isBetweenBottom('50')) {
                this.scrollToBottom();
            }
        }
    },
    methods: {
        scrollToBottom() {
            this.$refs.terminal.scrollTop = this.$refs.terminal.scrollHeight;
        },
        isBetweenBottom(gap) {
            return (
                this.$refs.terminal.scrollTop +
          gap +
          this.$refs.terminal.clientHeight >=
        this.$refs.terminal.scrollHeight
            );
        }
    }
};
</script>
<style lang="scss" scoped>
.terminal {
  background: #000;
  flex: 1;
  height: 100%;
  overflow: auto;
}
</style>