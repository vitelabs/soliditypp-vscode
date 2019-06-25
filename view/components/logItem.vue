<template>
    <div>
        <div class="log-header" @click="toggle">
            <i class="el-icon-caret-right" v-if="show"></i>
            <i class="el-icon-caret-bottom" v-else></i>

            <span class="log-created-time">{{log.createdTime.format('YYYY-MM-DD HH:mm:ss.SSS')}}</span>
        </div>

        <div class="log-content" v-if="show">
            <vue-json-pretty :data="log.content"></vue-json-pretty>
        </div>
    </div>
</template>
<script>
import VueJsonPretty from 'vue-json-pretty';

export default {
    props: ['show', 'log'],
    components: {
        VueJsonPretty
    },
    methods: {
        toggle() {
            this.show = this.show ? false : true;
        }
    }
};
</script>

<style lang="scss" scoped>
.log-header {
  cursor: pointer;
}
.log-item {
  border-top: 1px solid #666;
  border-bottom: 1px solid #666;
  .log-created-time {
    color: #00ff7f;
  }
  .log-content {
    padding-left: 10px;
  }
}
</style>
