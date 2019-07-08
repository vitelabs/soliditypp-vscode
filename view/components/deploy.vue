<template>
    <div
        v-loading="status === 'DEPLOYING'"
        element-loading-text="deploying"
        element-loading-background="rgba(0, 0, 0, 0.8)"
    >
        <el-row class="row" type="flex" align="middle">
            <el-col :span="1">
                <help
                    text="The amount of vite token is transferred by `send create block` which is used to create a contract. The basic unit of token is vite, the smallest
unit is attov, 1 vite = 1018 attov"
                ></help>
            </el-col>
            <el-col :span="3" class="label">transfer</el-col>
            <el-col :span="15" :offset="1">
                <el-input v-model="amount" size="small"></el-input>
            </el-col>
            <el-col :span="4">
                <units class="units" v-model="amountUnits"></units>
            </el-col>
        </el-row>
        <template v-if="constructAbi && constructAbi.inputs">
            <el-row
                class="row"
                type="flex"
                align="middle"
                :key="index"
                v-for="(input, index) in constructAbi.inputs"
            >
                <el-col :span="3" class="label">{{input.name}}</el-col>

                <el-col :span="20">
                    <el-input v-model="params[index]" size="small"></el-input>
                </el-col>
            </el-row>
        </template>

        <div class="deploy-button-wrapper">
            <el-button @click="deploy" size="small">deploy</el-button>
        </div>
    </div>
</template>

<script>
import * as vite from 'global/vite';
import postError from 'utils/postError';
import units from 'components/units';

export default {
    // props: ['abi', 'bytecodes', 'offchainCodes', 'account'],
    props: ['deployInfo'],

    components: {
        units
    },

    data() {
        return {
            amount: '0',
            amountUnits: '',
            params: [],
            status: 'BEFORE_DEPLOY'
        };
    },
    computed: {
        constructAbi() {
            let abi = this.deployInfo.compileInfo.abi;
            if (!abi) {
                return undefined;
            }

            for (let i = 0; i < abi.length; i++) {
                let methodAbi = abi[i];

                if (methodAbi.type === 'constructor') {
                    return methodAbi;
                }
            }

            return undefined;
        }
    },
    created() {
        this.params = [];
        if (this.constructAbi) {
            this.constructAbi.inputs.forEach(input => {
                if (input.type === 'address') {
                    this.params.push(
                        'vite_0000000000000000000000000000000000000000a4f3a0cb58'
                    );
                } else {
                    this.params.push('');
                }
            });
        }
    },
    methods: {
        async deploy() {
            try {
                this.status = 'DEPLOYING';

                let createContractTx = await vite.createContract(
                    this.deployInfo.selectedAccount,
                    {
                        bytecodes: this.deployInfo.compileInfo.bytecodes,
                        abi: this.deployInfo.compileInfo.abi
                    },
                    vite.transformViteBalance(this.amount, this.amountUnits),
                    this.params
                );

                let client = vite.getVite();
                let createContractBlock = await client.request(
                    'ledger_getBlockByHeight',
                    createContractTx.accountAddress,
                    createContractTx.height
                );

                this.$message({
                    message: 'Contract has been deployed.',
                    type: 'success'
                });

                this.$store.commit('deployed', {
                    deployInfo: this.deployInfo,
                    sendCreateBlock: createContractBlock
                });

                // this.$store.commit('addLog', {
                //     deployInfo: this.deployInfo,
                //     log: createContractBlock
                // });
            } catch (err) {
                this.$message({
                    message: 'Contract deployed failed. Get details in the debug console',
                    type: 'failed'
                });
                postError(err);
            }
            this.status = 'BEFORE_DEPLOY';
        }
    }
};
</script>
<style lang="scss" scoped>
.label {
  text-align: center;
}
.row {
  margin-bottom: 10px;
}
.units {
  margin-left: 5px;
}
.deploy-button-wrapper {
  margin: 10px 0;
  text-align: center;
}
</style>