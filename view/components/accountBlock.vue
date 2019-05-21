<template>
    <div class="wrapper">
        <el-row type="flex" justify="center" class="row">
            <el-col class="key-col col no-border" :span="6">status</el-col>
    
            <el-col class="col no-border" :span="18">
                {{displayStatus()}}
            </el-col>
        </el-row>    
        <template v-for="(value, key) in data">
            <el-row :key="key" type="flex" justify="center" class="row"  v-if="!isInDisplayBlackList(key)">
                <el-col class="key-col col" :span="6">{{key}}</el-col>

                <el-col class="col" :span="18">
                    <template v-if="key === 'logs'">
                        
                        <vue-json-pretty
                            :data="value">
                        </vue-json-pretty>
                    </template>
                    <template v-else>
                        {{value}}
                    </template>
                </el-col>
            </el-row>    
        </template>
    </div>
</template>
  
<script>
import { utils } from '@vite/vitejs';
import VueJsonPretty from 'vue-json-pretty';

export default {
    props: ['data'],
    components: {
        VueJsonPretty
    },
    data () {
        return {
            displayBlackList: ['receiveBlockHeights', 'tokenInfo', 'confirmedTimes'],
        };
    },
    methods:{ 
        isInDisplayBlackList (attrName) {
            return this.displayBlackList.indexOf(attrName) >= 0;
        },

        resolveData (accountBlock) {

            if ((accountBlock.blockType != 4 &&
                accountBlock.blockType != 5) || 
                !accountBlock.data) {
                return 0;
            }
            let bytes = utils._Buffer.from(accountBlock.data, 'base64');
            
            if (bytes.length != 33) {
                return 0;
            } 
            return bytes[32];
        },

        displayStatus () {
            let status = this.resolveData(this.data);
            let statusTxt = '';
            switch (status) {
            case 0:
                statusTxt = '0, Execution succeed';
                break;
            case 1: 
                statusTxt = '1, Execution reverted';
                break;
            case 2: 
                statusTxt = '2, Max call depth exceeded';
                break;
            }
            return statusTxt;
        }
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

        &.no-border {
            border: none;
        }


    }
    .key-col {
        text-align: center;
    }
</style>

<style lang="scss">
    .vjs__tree {
        font-size: inherit !important; 
    }
</style>