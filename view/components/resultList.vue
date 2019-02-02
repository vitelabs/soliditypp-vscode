<template>
    <div>
        <div :key="index" class="module-wrapper" v-for="(callHistory, index) in reverseCallHistory">
            <h4 class="title">Result(blockHeight: {{callHistory.request.height}})</h4>  
            <div>
                <h5 class="title">
                    <i class="el-icon-caret-bottom" @click="hideRequest(callHistory)" v-if="callHistory.isShowRequest"></i>
                    <i class="el-icon-caret-right"  @click="showRequest(callHistory)" v-else></i>
                    Request
                </h5>
                <account-block v-if="callHistory.isShowRequest" :data="callHistory.request"></account-block>
            </div>
            <div>
                <h5 class="title">
                    <i class="el-icon-caret-bottom" @click="hideResponseList(callHistory)" v-if="callHistory.isShowResponseList"></i>
                    <i class="el-icon-caret-right" @click="showResponseList(callHistory)" v-else></i>
                    Response
                </h5> 
                <template v-if="callHistory.isShowResponseList">
                    <template v-if="callHistory.responseList && callHistory.responseList.length > 0">
                        <div :key="index" v-for="(response, index) in callHistory.responseList">
                            <account-block :data="response"></account-block>
                        </div>                        
                    </template>
                    <div 
                        class="waiting-response"
                        v-loading="true"  
                        element-loading-text="waiting" 
                        v-else>
                    </div>
                </template>

            </div>
        </div>
    </div>
</template>

<script>
import accountBlock from './accountBlock';
import * as vite from 'global/vite.js';
import Task from 'utils/task';

export default {
    props: [
        'account'
    ],
    components: {
        accountBlock
    },
    data () {
        return {
            blockHeight: 0,
            status: 'QUERY_SEND_BLOCK',
            currentSendBlock: undefined,
            
            callHistoryList: [],
            isShowRequest: false,
            isShowResponseList: false
        };
    },

    computed: {
        reverseCallHistory () {
            return this.callHistoryList.slice(0).reverse();
        }
    },

    mounted () {
        new Task(async () => {
            return await this.updateCallHistoryList();
        }, 500).start();
    },

    methods: {
        updateView () {
            this.callHistoryList = this.callHistoryList.slice(0);
        },

        showRequest (callHistory) {
            callHistory.isShowRequest = true;
            this.updateView();
        },
        hideRequest (callHistory) {
            callHistory.isShowRequest = false;
            this.updateView();
        },
        showResponseList (callHistory) {
            callHistory.isShowResponseList = true;
            this.updateView();
        },
        hideResponseList (callHistory) {
            callHistory.isShowResponseList = false;
            this.updateView();
        },
        async updateCallHistoryList () {
            if (!this.account) {
                return true;
            }
            let client = vite.getVite();

            if (this.status === 'QUERY_SEND_BLOCK') {
                let nextBlockHeight = this.blockHeight + 1;
                let block = await client.request('ledger_getBlockByHeight', this.account.address, nextBlockHeight.toString());
            
                if (!block) {
                    return true;
                }

                this.blockHeight = nextBlockHeight;
                
                if (block.blockType === 4 || block.blockType === 5) {
                    // receive block
                    return true;
                }

                this.callHistoryList.push({
                    isShowRequest: false,
                    isShowResponseList: false,
                    request: block,
                    responseList: []
                });
                this.currentSendBlock = block;
                this.status = 'QUERY_RESPONSE_BLOCKS';
            }

            if (this.status === 'QUERY_RESPONSE_BLOCKS') {
                let block = await client.request('ledger_getBlockByHeight', this.account.address, this.currentSendBlock.height);
                
                if (!block) {
                    return true;
                }


                let receiveBlockHeights = block.receiveBlockHeights;     
                if (!receiveBlockHeights || receiveBlockHeights.length <= 0) {
                    return true;
                }

                let receiveBlocks = await this.queryReceiveBlocks(block.toAddress, receiveBlockHeights);
                this.callHistoryList[this.callHistoryList.length - 1].responseList = receiveBlocks;
                this.currentSendBlock = undefined;
                this.status = 'QUERY_SEND_BLOCK';
            }
            return true;
        
        },

        async queryReceiveBlocks (contractAddress, receiveBlockHeights) {
            let client = vite.getVite();
            let blocks = [];
            for (let i = 0; i < receiveBlockHeights.length; i++) {
                let block = await client.request('ledger_getBlockByHeight', contractAddress, receiveBlockHeights[i].toString());
                if (block) {
                    blocks.push(block);
                }
            }
            return blocks;
        }
    }
};
</script>
<style lang="scss" scoped>
    i {
        cursor: handler;
    }
    .waiting-response {
        height: 100px;
    }
</style>