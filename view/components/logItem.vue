<template>
    <div :class="{'log-error': log.type === 'error'}">
        <div class="log-header" @click="toggle">
            <i class="el-icon-caret-bottom" v-if="show"></i>
            <i class="el-icon-caret-right" v-else></i>

            <span class="log-title">
                {{log.createdTime.format('YYYY-MM-DD HH:mm:ss')}}
                [{{log.type.toUpperCase()}}]
                <span
                    class="title-content"
                    v-html="log.title"
                ></span>
            </span>
        </div>

        <div class="log-content" v-if="show">
            <account-block v-if="log.dataType === 'accountBlock'" :data="log.content"></account-block>
            <vue-json-pretty v-if="log.dataType=== 'json'" :data="log.content"></vue-json-pretty>
            <vue-json-pretty v-if="log.dataType=== 'text'" :data="textToJSON(log.content)"></vue-json-pretty>
            <!-- <div class="log-text" v-if="log.dataType=== 'text'">{{log.content}}</div> -->
        </div>
    </div>
</template>
<script>
import VueJsonPretty from 'vue-json-pretty';
import AccountBlock from 'components/accountBlock.vue';

export default {
    props: ['log'],
    components: {
        VueJsonPretty,
        AccountBlock
    },
    data() {
        return {
            show: false
        };
    },
    methods: {
        toggle() {
            this.show = this.show ? false : true;
        },
        textToJSON(text) {
            let obj;
            try {
                obj = JSON.parse(text);
            } catch (err) {
                obj = text;
            }
            return obj;
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
  .log-title {
    font-size: 14px;
    font-weight: 600;
    color: #00ff7f;
    .title-content {
      color: #fff;
      font-weight: 400;
    }
  }
  //   .log-content {
  //     padding-left: 10px;
  //     word-break: break-all;
  //   }
}
.log-text {
  padding: 8px;
  font-size: 14px;
}
.log-error {
  .log-title {
    color: #f56c6c;
  }
}
</style>
