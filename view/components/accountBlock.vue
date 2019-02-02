<template>
    <div class="wrapper">
        <template v-for="(value, key) in data">
            <el-row :key="key" type="flex" justify="center" class="row"  v-if="!isInDisplayBlackList(key)">
                <el-col class="key-col col" :span="6">{{key}}</el-col>
    
                <el-col class="col" :span="16">{{value}}</el-col>
            </el-row>    
        </template>
        
    </div>
</template>
  
<script>
export default {
    props: ['data'],
    data () {
        return {
            displayBlackList: ['receiveBlockHeights', 'tokenInfo', 'confirmedTimes'],
        };
    },
    methods:{ 
        isInDisplayBlackList (attrName) {
            return this.displayBlackList.indexOf(attrName) >= 0;
        },
    }
};
</script>

<style lang="scss" scoped>    
    .row {
        line-height: 18px
    }
    .col {
        word-break: break-all;
        border-top: 1px dashed #999;
    }
    .key-col {
        text-align: center;
    }
</style>
