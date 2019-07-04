<template>
    <div class="terminal" ref="terminal">
        <div class="log-item" v-for="(log, index) in deployInfo.logs" :key="index">
            <log-item :log="log"></log-item>
        </div>
    <!-- <div :key="index" v-for="(callHistory, index) in reverseCallHistory">
            <h4 class="title">
                <template
                    v-if="callHistory.methodName"
                >Call "{{callHistory.methodName}}" ({{getCurrentTime()}}):</template>
                <template v-else>Deploy ({{getCurrentTime()}}):</template>
            </h4>
            <div>
                <h5 class="title">
                    <i
                        class="el-icon-caret-bottom"
                        @click="hideRequest(callHistory)"
                        v-if="callHistory.isShowRequest"
                    ></i>
                    <i class="el-icon-caret-right" @click="showRequest(callHistory)" v-else></i>
                    Request
                </h5>
                <div v-if="callHistory.isShowRequest" class="block-wrapper">
                    <account-block :data="callHistory.request"></account-block>
                </div>
            </div>
            <div>
                <h5 class="title">
                    <i
                        class="el-icon-caret-bottom"
                        @click="hideResponseList(callHistory)"
                        v-if="callHistory.isShowResponseList"
                    ></i>
                    <i class="el-icon-caret-right" @click="showResponseList(callHistory)" v-else></i>
                    Response
                </h5>

                <template v-if="callHistory.isShowResponseList">
                    <template v-if="callHistory.responseList && callHistory.responseList.length > 0">
                        <div
                            class="block-wrapper"
                            :key="index"
                            v-for="(response, index) in callHistory.responseList"
                        >
                            <account-block :data="response"></account-block>
                        </div>
                    </template>
                    <div class="waiting-response" v-loading="true" element-loading-text="waiting" v-else></div>
                </template>
            </div>
    </div>-->
    </div>
</template>

<script>
// import accountBlock from './accountBlock';
// import * as vite from 'global/vite.js';
// import Task from 'utils/task';
// import postError from 'utils/postError';
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
    // data() {
    //     return {
    //         blockHeight: 0,
    //         status: 'QUERY_SEND_BLOCK',
    //         currentSendBlock: undefined,
    //         callHistoryList: [],
    //         isShowRequest: false,
    //         isShowResponseList: false
    //     };
    // },
    // mounted() {
    //     this.onSendContractTx(undefined, this.sendCreatBlock);
    // },
    // computed: {

    // reverseCallHistory() {
    //     return this.callHistoryList.slice(0).reverse();
    // }
    // },
    // methods: {
    //     getCurrentTime() {
    //         var curr = new Date();
    //         return moment(curr.getTime()).format('YYYY-MM-DD HH:mm:ss');
    //     },
    //     updateView() {
    //         this.callHistoryList = this.callHistoryList.slice(0);
    //     },
    //     showRequest(callHistory) {
    //         callHistory.isShowRequest = true;
    //         this.updateView();
    //     },
    //     hideRequest(callHistory) {
    //         callHistory.isShowRequest = false;
    //         this.updateView();
    //     },
    //     showResponseList(callHistory) {
    //         callHistory.isShowResponseList = true;
    //         this.updateView();
    //     },
    //     hideResponseList(callHistory) {
    //         callHistory.isShowResponseList = false;
    //         this.updateView();
    //     },
    //     onSendContractTx(methodAbi, contractTx) {
    //         let client = vite.getVite();
    //         let callHistory = {
    //             isShowRequest: false,
    //             isShowResponseList: false,
    //             request: contractTx,
    //             responseList: []
    //         };
    //         if (methodAbi) {
    //             callHistory.methodName = methodAbi.name;
    //         }
    //         this.callHistoryList.push(callHistory);
    //         new Task(async () => {
    //             try {
    //                 let block = await client.request(
    //                     'ledger_getBlockByHeight',
    //                     contractTx.accountAddress,
    //                     contractTx.height
    //                 );
    //                 if (!block) {
    //                     return true;
    //                 }
    //                 let receiveBlockHash = block.receiveBlockHash;
    //                 if (!receiveBlockHash) {
    //                     return true;
    //                 }
    //                 let receiveBlock = await this.queryReceiveBlock(receiveBlockHash);
    //                 if (!receiveBlock) {
    //                     return true;
    //                 }
    //                 let responseList = [];
    //                 responseList.push(receiveBlock);
    //                 await this.setVmLogList(responseList);
    //                 callHistory.responseList = responseList;
    //                 return false;
    //             } catch (err) {
    //                 postError(err);
    //             }
    //         }, 500).start();
    //     },
    //     async setVmLogList(contractBlocks) {
    //         for (let i = 0; i < contractBlocks.length; i++) {
    //             let contractBlock = contractBlocks[i];
    //             let vmLogs = await vite.queryVmLogList(contractBlock, this.abi);
    //             contractBlock.logs = vmLogs;
    //         }
    //     },
    //     async queryReceiveBlock(receiveBlockHash) {
    //         let client = vite.getVite();
    //         return await client.request('ledger_getBlockByHash', receiveBlockHash);
    //     }
    // }
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