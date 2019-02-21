<template>
    <div>
        <div :key="index" v-for="(callHistory, index) in reverseCallHistory">
            <h4 class="title">
                <template v-if="callHistory.methodName">Call "{{callHistory.methodName}}" ({{formatTimestamp(callHistory.request.timestamp)}}):</template>   
                <template v-else>Deploy ({{formatTimestamp(callHistory.request.timestamp)}}):</template>   
            </h4>  
            <div>
                <h5 class="title">
                    <i class="el-icon-caret-bottom" @click="hideRequest(callHistory)" v-if="callHistory.isShowRequest"></i>
                    <i class="el-icon-caret-right"  @click="showRequest(callHistory)" v-else></i>
                    Request
                </h5>
                <div v-if="callHistory.isShowRequest" class="block-wrapper">
                    <account-block :data="callHistory.request"></account-block>
                </div>
            </div>
            <div>
                <h5 class="title">
                    <i class="el-icon-caret-bottom" @click="hideResponseList(callHistory)" v-if="callHistory.isShowResponseList"></i>
                    <i class="el-icon-caret-right" @click="showResponseList(callHistory)" v-else></i>
                    Response
                </h5>
                <template v-if="callHistory.isShowResponseList">
                    <template v-if="callHistory.responseList && callHistory.responseList.length > 0">
                        <div class="block-wrapper" :key="index" v-for="(response, index) in callHistory.responseList">
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
import * as moment from 'moment';
import accountBlock from './accountBlock';
import * as vite from 'global/vite.js';
import Task from 'utils/task';
import throwError from 'utils/throwError';

export default {
    props: [
        'contractAddress',
        'abi',
        'sendCreatBlock'
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

    mounted () {
        this.onSendContractTx(undefined, this.sendCreatBlock);
    },

    computed: {
        reverseCallHistory () {
            return this.callHistoryList.slice(0).reverse();
        }
    },

    methods: {
        formatTimestamp (timestamp) {
            return moment(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
        }, 
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

        onSendContractTx (methodAbi, contractTx) {
            let client = vite.getVite();

            let callHistory = {
                isShowRequest: false,
                isShowResponseList: false,

                request: contractTx,
                responseList: []
            };

            if (methodAbi) {
                callHistory.methodName = methodAbi.name;
            }
            
            this.callHistoryList.push(callHistory);

            new Task(async () => {
                try {
                    let block = await client.request('ledger_getBlockByHeight', contractTx.accountAddress, contractTx.height);
                        
                    if (!block) {
                        return true;
                    }

                    let receiveBlockHeights = block.receiveBlockHeights;     
                    if (!receiveBlockHeights || receiveBlockHeights.length <= 0) {
                        return true;
                    }
                    
                    let receiveBlocks = await this.queryReceiveBlocks(block.toAddress, receiveBlockHeights);
                    let lastReceiveBlock = receiveBlocks[receiveBlocks.length - 1];
                    // receive error
                    if (lastReceiveBlock.blockType === 5) {
                        return true;
                    }

                    let sendBlocks = await this.queryContractSendBlocks(block.toAddress, parseInt(lastReceiveBlock.height));
                    let responseList = receiveBlocks.concat(sendBlocks);
                    await this.setVmLogList(responseList);
                    callHistory.responseList = responseList;

                    return false;
                } catch (err) {
                    throwError(err);
                }
                    
            }, 500).start();

        },
            
        async setVmLogList (contractBlocks) {
            for (let i = 0; i < contractBlocks.length; i++) {
                let contractBlock = contractBlocks[i];
                let vmLogs = await vite.queryVmLogList(contractBlock, this.abi);
                contractBlock.logs = vmLogs;
            }
        
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
        },

        async queryContractSendBlocks (contractAddress, lastReceiveBlockHeight) {
            let client = vite.getVite();
            let blocks = [];
            for (let h = lastReceiveBlockHeight + 1; ; h++) {
                let block = await client.request('ledger_getBlockByHeight', contractAddress, h.toString());
                
                if (!block) {
                    break;
                }

                // send block
                if (block.blockType === 1 || 
                    block.blockType === 2 ||
                    block.blockType === 3 ||
                    block.blockType === 6) {
                    blocks.push(block);
                } else {
                    break;
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
    .block-wrapper {
        border: 1px solid #999;
        margin: 10px;
    }
    .waiting-response {
        height: 100px;
    }
</style>