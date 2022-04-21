<template>
    <div
        v-loading="status === 'DEPLOYING'"
        element-loading-text="deploying"
        element-loading-background="rgba(0, 0, 0, 0.8)"
        class="deploy"
    >
        <div class="container">
            <label>Amount
                <help text="The amount of vite token is transferred by send create block which is used to create a contract. The basic unit of token is vite, the smallest
    unit is attov, 1 vite = 1e18 attov"></help>
            </label>
            <el-input class="item-input" v-model="amount" size="small">
                <template slot="append">
                    <el-select class="unit-select" v-model="amountUnits" size="small">
                        <el-option value="vite">vite</el-option>
                        <el-option value="attov">attov</el-option>
                    </el-select>
                </template>
            </el-input>
            <label>Response Latency Time</label>
            <el-input class="item-input" v-model="responseLatency" size="small"></el-input>
            <label>Quota Multiplier</label>
            <el-input class="item-input" v-model="quotaMultiplier" size="small"></el-input>
            <label>Random degree</label>
            <el-input class="item-input" v-model="randomDegree" size="small"></el-input>
        </div>

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
            <el-button @click="deploy" size="small" type="primary">deploy</el-button>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as vite from 'global/vite';

export default {
    props: ['deployInfo'],

    data() {
        return {
            amount: '0',
            amountUnits: 'vite',
            responseLatency: 0,
            quotaMultiplier: 10,

            randomDegree: 0,

            params: [],
            status: 'BEFORE_DEPLOY'
        };
    },
    computed: {
        ...mapGetters(['selectedAccount']),
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
                if (Number(this.responseLatency) < Number(this.randomDegree)) {
                    return this.$message({
                        message: 'responseLatency can\'t less than randomDegree',
                        type: 'error'
                    });
                }

                this.status = 'DEPLOYING';


                let createContractTx = await vite.createContract(
                    this.selectedAccount,
                    {
                        bytecodes: this.deployInfo.compileInfo.bytecodes,
                        abi: this.deployInfo.compileInfo.abi
                    },
                    vite.transformViteBalance(this.amount, this.amountUnits),
                    this.responseLatency,
                    this.quotaMultiplier,
                    this.randomDegree,

                    this.params
                );

                let client = vite.getVite();
                let createContractBlock = await client.request(
                    'ledger_getBlockByHeight',
                    this.selectedAccount.address,
                    createContractTx.height
                );

                this.$message({
                    message: 'Contract has been deployed.',
                    type: 'success'
                });

                this.$store.commit('deployed', {
                    contract: createContractBlock,
                    contractName: this.deployInfo.compileInfo.contractName
                });

                // this.$store.commit('addLog', {
                //     deployInfo: this.deployInfo,
                //     log: createContractBlock
                // });
            } catch (err) {
                console.log('deploy fail, ', err.message);
                this.$store.commit('addLog', {
                    deployInfo: this.deployInfo,
                    title: `deploy ${this.deployInfo.compileInfo.contractName} failed`,
                    log: err,
                    type: 'error'
                });
            }
            this.status = 'BEFORE_DEPLOY';
        }
    }
};
</script>
<style lang="scss" scoped>
.deploy {
    font-size: 12px;
}
.container {
    display: grid;
    grid-template-columns: 140px 1fr;
    label {
        line-height: 32px;
        margin-bottom: 10px;
        text-align: right;
        padding-right: 10px;
    }
    .item-input {
        margin-bottom: 10px;
    }
    .unit-select {
        width: 80px;
    }
}
.deploy-button-wrapper {
    text-align: right;
}
</style>
