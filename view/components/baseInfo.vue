<template>
    <div class="base-info">
        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="2">
                <help text="Abi of contract"></help>
            </el-col>
            <el-col :span="4" class="prop-label">abi</el-col>
            <el-col :span="12" :offset="1">
                <el-button size="small" @click="showAbi()">show abi</el-button>
            </el-col>
        </el-row>
        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="2">
                <help text="assembly of contract"></help>
            </el-col>
            <el-col :span="4" class="prop-label">assembly</el-col>
            <el-col :span="12" :offset="1">
                <el-button size="small" @click="showAsm()"
                >show assembly</el-button
                >
            </el-col>
        </el-row>
        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="2">
                <help text="Compiled code of contract"></help>
            </el-col>
            <el-col :span="4" class="prop-label">binary</el-col>
            <el-col :span="12" :offset="1">
                <el-button size="small" @click="showCode()"
                >show binary</el-button
                >
            </el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="2">
                <help text="Compiled offchain code of contract"></help>
            </el-col>
            <el-col :span="4" class="prop-label">offchain code</el-col>
            <el-col :span="12" :offset="1">
                <el-button size="small" @click="showOffchaincode()"
                >show offchain code</el-button
                >
            </el-col>
        </el-row>

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
        ...mapGetters(['addressMap', 'selectedAccount'])
    },

    methods: {
        showAbi() {
            this.isShowAbi = true;
        },
        showCode() {
            this.isShowCode = true;
        },
        showOffchaincode() {
            this.isShowOffchainCode = true;
        },
        showAsm() {
            this.isShowAsm = true;
        }
    }
};
</script>
<style lang="scss" scoped>
.base-info {
    font-size: 12px;
}
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
