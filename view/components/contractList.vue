<template>
    <div class="contract-list">
        <div v-if="contractList.length">
            <el-collapse v-model="activeContract">
                <el-collapse-item
                    v-for="(contract, idx) in contractList"
                    :key="idx"
                    :title="`${contract.contractName} #${idx}: ${contract.toAddress}`"
                    :name="idx">
                    <contract :deploy-info="deployInfo" :contract="contract"></contract>
                </el-collapse-item>
            </el-collapse>
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
    data() {
        return {
            activeContract: 0,
            loadContractAddress: ''
        };
    },
    computed: {
        ...mapState(['contracts']),
        contractList() {
            return this.contracts.filter(item => item.contractName === this.deployInfo.compileInfo.contractName);
        }
    },
    watch: {
        contractList(val) {
            this.activeContract = val.length - 1;
        }
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
    background: #fff;
    padding: 20px;
    h3 {
        font-size: 14px;
    }
}
</style>

