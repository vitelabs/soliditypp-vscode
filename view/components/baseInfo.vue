<template>
    <div class="contract-info">
        <ul>
            <li>
                <el-button size="small" @click="showAbi()">show ABI</el-button>
                <span>ABI of contract</span>
            </li>
            <li>
                <el-button size="small" @click="showAsm()">show assembly</el-button>
                <span>Assembly of contract</span>
            </li>
            <li>
                <el-button size="small" @click="showBinary()">show binary</el-button>
                <span>Compiled code of contract</span>
            </li>
            <li>
                <el-button size="small" @click="showOffchaincode()">show offchain code</el-button>
                <span>Compiled offchain code of contract</span>
            </li>
        </ul>

        <el-dialog
            :visible.sync="isShowAbi"
            custom-class="grey-dialog"
            :fullscreen="true"
            title="abi"
        >
            <!-- <div class="abi-dialog"> -->
            <div>
                <i
                    class="el-icon-document-copy copy-icon"
                    :data-clipboard-text="
                        JSON.stringify(deployInfo.compileInfo.abi)
                    "
                ></i>
            </div>
            <vue-json-pretty
                :show-length="true"
                :data="deployInfo.compileInfo.abi"
            ></vue-json-pretty>
            <!-- </div> -->
        </el-dialog>
        <el-dialog
            :visible.sync="isShowAsm"
            custom-class="grey-dialog"
            :fullscreen="true"
            title="assembly"
        >
            <!-- <div class="abi-dialog"> -->
            <div>
                <i
                    class="el-icon-document-copy copy-icon"
                    :data-clipboard-text="deployInfo.compileInfo.asm"
                ></i>
            </div>
            <div style="white-space:pre-wrap">
                {{ deployInfo.compileInfo.asm }}
            </div>
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
            <div>{{ deployInfo.compileInfo.bytecodes }}</div>
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
            <div id="offchainCodeContent">
                {{ deployInfo.compileInfo.offchainCode }}
            </div>
        </el-dialog>
    </div>
</template>
<script>
import ClipboardJS from 'clipboard';
import VueJsonPretty from 'vue-json-pretty';
import { mapState, mapGetters } from 'vuex';

export default {
    props: ['deployInfo'],
    components: {
        VueJsonPretty
    },
    data() {
        return {
            isShowAbi: false,
            isShowCode: false,
            isShowOffchainCode: false,
            isShowAsm: false,

            updateBalanceTimer: null
        };
    },
    mounted() {
        new ClipboardJS('.copy-icon');
    },

    computed: {
        ...mapState(['snapshotHeight', 'accounts']),
        ...mapGetters(['addressMap', 'selectedAccount']),
        idx() {
            return this.deployInfo.index;
        }
    },

    methods: {
        showAbi() {
            window.open(this.$router.resolve(`/abi/${this.idx}`).href, `abi${this.idx}`);
            // this.isShowAbi = true;
        },
        showBinary() {
            window.open(this.$router.resolve(`/binary/${this.idx}`).href, `binary${this.idx}`);
            // this.isShowCode = true;
        },
        showOffchaincode() {
            window.open(this.$router.resolve(`/offchain/${this.idx}`).href, `offchain${this.idx}`);
            // this.isShowOffchainCode = true;
        },
        showAsm() {
            window.open(this.$router.resolve(`/asm/${this.idx}`).href, `asm${this.idx}`);
            // this.isShowAsm = true;
        }
    }
};
</script>
<style lang="scss" scoped>
.contract-info {
    font-size: 12px;
    ul {
        list-style: none;
        margin-top: -10px;
        li {
            margin: 10px 0;
            span {
                margin-left: 12px;
                color: #666;
            }
        }
    }
}
.copy-icon {
    font-size: 20px;
    &:hover {
        cursor: pointer;
        color: #67c23a;
    }
}
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
