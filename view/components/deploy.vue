<template>
    <div class="module-wrapper">
        <h4 class="title">Deploy contract</h4>
        <div v-if="status !== 'DEPLOYED'" 
             v-loading="status === 'DEPLOYING'"
             element-loading-text="deploying"
             element-loading-background="rgba(0, 0, 0, 0.8)"
        >
            <el-row class="row" type="flex" justify="center" align="middle">
                <el-col  :span="4" class="label">amount </el-col>
                <el-col  :span="18">
                    <el-input v-model="amount"></el-input>
                </el-col>
            </el-row>
            <el-row class="row" type="flex" justify="center" align="middle" :key="index" v-for="(input, index) in constructAbi.inputs">
                <el-col :span="4" class="label">{{input.name}}</el-col>
    
                <el-col :span="18">
                    <el-input v-model="params[index]"></el-input>
                </el-col>
            </el-row>
            <div class="deploy-button-wrapper">
                <el-button @click="deploy">deploy</el-button>
            </div>
        </div>
    </div>
</template>
<script>
import * as vite from 'global/vite';

export default {
    props: ['abi', 'bytecodes'],
    data () {
        return {
            amount: '0',
            params: [],
            status: 'BEFORE_DEPLOY'
        };
    },
    computed: {
        constructAbi () {
            if (!this.abi) {
                return undefined;
            }

            for (let i = 0; i < this.abi.length; i++) {
                let methodAbi = this.abi[i];
            
                if (methodAbi.type === 'constructor') {
                    return methodAbi;
                }
            }

            return undefined;
        }
    },
    created () {
        this.params = [];
        this.constructAbi.inputs.forEach((input) => {
            if (input.type === 'address') {
                this.params.push('vite_0000000000000000000000000000000000000000a4f3a0cb58');
            } else {
                this.params.push('');
            }
        });
    },
    methods: {
        async deploy () {
            this.status = 'DEPLOYING';
            let createContractBlock = await vite.createContract(vite.getTestAccount(), {
                bytecodes: this.bytecodes,
                abi: this.abi
            }, this.amount, this.params); 
        
            this.status = 'DEPLOYED';
            this.$message({
                message: 'Contract has been deployed!',
                type: 'success'
            });
            this.$emit('deployed', createContractBlock.toAddress);
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
    .deploy-button-wrapper {
        margin: 10px 0;
        text-align: center;            
    }
</style>