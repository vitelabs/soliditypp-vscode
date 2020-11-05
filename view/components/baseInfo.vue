<template>
    <div>
        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="3">
                <el-link type="primary" @click="isShowTransfer=true">more vite</el-link>
            </el-col>
        </el-row>
        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="1">
                <help text="Number of blocks created by the address"></help>
            </el-col>
            <el-col :span="3" class="prop-label">block number</el-col>
            <el-col
                :span="15"
                :offset="1"
                v-if="selectedAccount.accountState"
            >{{selectedAccount.accountState.balance.blockCount}}</el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="1">
                <help text="Abi of contract"></help>
            </el-col>
            <el-col :span="3" class="prop-label">abi</el-col>
            <el-col :span="15" :offset="1">
                <el-button size="small" @click="showAbi()">show abi</el-button>
            </el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="1">
                <help text="Compiled code of contract"></help>
            </el-col>
            <el-col :span="3" class="prop-label">code</el-col>
            <el-col :span="15" :offset="1">
                <el-button size="small" @click="showCode()">show code</el-button>
            </el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="1">
                <help text="Compiled offchain code of contract"></help>
            </el-col>
            <el-col :span="3" class="prop-label">offchain code</el-col>
            <el-col :span="15" :offset="1">
                <el-button size="small" @click="showOffchaincode()">show offchain code</el-button>
            </el-col>
        </el-row>

        <el-dialog :visible.sync="isShowAbi" custom-class="grey-dialog" :fullscreen="true" title="abi">
            <!-- <div class="abi-dialog"> -->
            <div>
                <i
                    class="el-icon-document-copy copy-icon"
                    :data-clipboard-text="JSON.stringify(deployInfo.compileInfo.abi)"
                ></i>
            </div>
            <vue-json-pretty :show-length="true" :data="deployInfo.compileInfo.abi"></vue-json-pretty>
            <!-- </div> -->
        </el-dialog>
        <el-dialog
            custom-class="grey-dialog"
            :visible.sync="isShowCode"
            :fullscreen="true"
            title="code"
        >
            <div>
                <i
                    class="el-icon-document-copy copy-icon"
                    :data-clipboard-text="deployInfo.compileInfo.bytecodes"
                ></i>
            </div>
            <div>{{deployInfo.compileInfo.bytecodes}}</div>
        </el-dialog>
        <el-dialog
            custom-class="grey-dialog"
            :visible.sync="isShowOffchainCode"
            :fullscreen="true"
            title="offchain code"
        >
            <div>
                <i
                    class="el-icon-document-copy copy-icon"
                    :data-clipboard-text="deployInfo.compileInfo.offchainCode"
                ></i>
            </div>
            <div id="offchainCodeContent">{{deployInfo.compileInfo.offchainCode}}</div>
        </el-dialog>

        <el-dialog
            custom-class="grey-dialog"
            width="90%"
            :visible.sync="isShowTransfer"
            title="transfer"
        >
            <div>
                <transfer @afterTransfer="afterTransfer" :account="selectedAccount" />
            </div>
        </el-dialog>
    </div>
</template>
<script>
import * as vite from 'global/vite';
import ClipboardJS from 'clipboard';
import VueJsonPretty from 'vue-json-pretty';
import { mapState, mapGetters } from 'vuex';

import transfer from 'components/transfer';
const BigNumber = require('bignumber.js');

export default {
    props: ['deployInfo'],
    components: {
        VueJsonPretty,
        transfer
    },
    data() {
        return {
            isShowAbi: false,
            isShowCode: false,
            isShowOffchainCode: false,
            isShowTransfer: false,

            updateBalanceTimer: null,
        };
    },
    mounted() {
        new ClipboardJS('.copy-icon');
    },

    computed: {
        ...mapState(['snapshotHeight', 'accounts']),
        ...mapGetters(['addressMap', 'selectedAccount'])
    },

    methods: {
        afterTransfer(res) {
            this.isShowTransfer = false;
            if (res.error) {
                this.$store.commit('addLog', {
                    deployInfo: this.deployInfo,
                    title: 'transfer vite failed',
                    type: 'error',
                    log: res.error
                });
                return;
            }
        },
        transformBalance(amount, decimal) {
            return new BigNumber(amount).dividedBy(`1e${decimal}`).toFixed();
        },
        showAbi() {
            this.isShowAbi = true;
        },
        showCode() {
            this.isShowCode = true;
        },
        showOffchaincode() {
            this.isShowOffchainCode = true;
        }
    }
};
</script>
<style lang="scss" scoped>
.address-input {
  width: 100%;
}
.add-account-button {
  margin-left: 10px;
}
.copy-icon {
  font-size: 20px;
  &:hover {
    cursor: pointer;
    color: #67c23a;
  }
}
</style>

<style lang="scss">
.grey-dialog {
  background: #333 !important;
  //   color: #fff;
  .copy-icon,
  .el-dialog__header {
    color: #fff;
  }
  .el-dialog__header {
    .el-dialog__title {
      color: #fff;
    }
  }
  .el-dialog__body {
    color: #fff;
  }
}
</style>

