<template>
    <div class="contract-list">
        <div v-if="contractList.length">
            <el-row v-for="(contract, index) in contractList"
                    :key="index">
                <el-row>
                    <h5>
                        {{`${contract.contractName} #${index}: ${contract.toAddress}`}}
                    </h5>
                </el-row>
                <el-row>
                    <contract :deploy-info="deployInfo" :contract="contract"></contract>
                </el-row>
            </el-row>
        </div>
        <div v-else>
            <el-alert
                title="You can also input an exist contract address. After that, you can call this contract with current abi."
                style="margin-bottom:20px;"
                :closable="false"
                type="success">
            </el-alert>
            <el-row :gutter="20">
                <el-col :span="8">
                    <el-input v-model="loadContractAddress" placeholder="Please input the contract address" size="small"></el-input>
                </el-col>
                <el-col :span="8">
                    <el-button type="primary" size="small" @click="loadContract">Load Contract</el-button>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script>
import contract from 'components/contract';
import { mapState } from 'vuex';
import { wallet } from '@vite/vitejs';

export default {
    props: ['deployInfo'],
    components: { contract },
    computed: {
        ...mapState(['contracts']),
        contractList() {
            return this.contracts.filter(item => item.contractName === this.deployInfo.compileInfo.contractName);
        }
    },
    data() {
        return {
            activeNames: 0,
            loadContractAddress: ''
        };
    },
    methods: {
        loadContract() {
            if (wallet.isValidAddress(this.loadContractAddress) != 2) {
                return this.$message.error('Please input a valid address.');
            }
            this.$store.commit('deployed', {
                contract: {
                    toAddress: this.loadContractAddress,
                },
                contractName: this.deployInfo.compileInfo.contractName
            });
        }
    }
};
</script>

<style lang="scss" scoped>
.contract-list {
    padding-top: 20px;
}
</style>

