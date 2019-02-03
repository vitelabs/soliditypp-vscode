<template>
    <div class="module-wrapper">
        <h4 class="title">Call contract</h4>  
        <div  v-for="(functionAbi, functionAbiIndex) in functionAbiList" 
              :key="functionAbiIndex"
              v-loading="functionAbi.status === 'CALLING'"
              element-loading-text="calling"
              element-loading-background="rgba(0, 0, 0, 0.8)">

            <h5 class="title">
                <i class="el-icon-caret-bottom" @click="hideFunctionAbi(functionAbi)" v-if="functionAbi.isShow"></i>
                <i class="el-icon-caret-right"  @click="showFunctionAbi(functionAbi)" v-else></i>
                {{functionAbi.abi.name}}
            </h5>
            <template v-if="functionAbi.isShow">
                <el-row class="row" type="flex" justify="center" align="middle">
                    <el-col  :span="4" class="label">amount: </el-col>
                    <el-col  :span="18">
                        <el-input v-model="functionAbi.amount"></el-input>
                    </el-col>
                </el-row>

                <el-row class="row" type="flex" justify="center" align="middle" :key="input.name" v-for="(input, index) in functionAbi.abi.inputs">
                    <el-col :span="4" class="label">{{input.name}}</el-col>
    
                    <el-col :span="18">
                        <el-input v-model="functionAbi.params[index]"></el-input>
                    </el-col>
                </el-row>

                <div class="call-button-wrapper">
                    <el-button @click="callContract(functionAbi)">call "{{functionAbi.abi.name}}"</el-button>
                </div>
            </template>

        </div>
    </div>
</template>
<script>
import * as vite from 'global/vite';
import throwError from 'utils/throwError';

export default {
    props: ['account', 'abi', 'contractAddress'],
    data () {
        return {
            functionAbiList: []
        };
    },
    
    created () {
        for (let i = 0; i < this.abi.length; i++) {
            let methodAbi = this.abi[i];
                    
            if (methodAbi.type === 'function') {
                this.functionAbiList.push({
                    isShow: false,
                    status: 'BEFORE_CALL',
                    abi: methodAbi,
                    params: this.getParams(methodAbi),
                    amount: '0'
                });
            }
        }
    },
    methods: {
        makeViewUpdate () {
            // make update
            this.functionAbiList =this.functionAbiList.slice(0);
        },
        showFunctionAbi(functionAbi) {
            functionAbi.isShow = true;
            this.makeViewUpdate();
        },
        hideFunctionAbi(functionAbi) {
            functionAbi.isShow = false;
            // make update
            this.makeViewUpdate();
        },
        getParams (methodAbi) {
            let params = [];
            methodAbi.inputs.forEach((input) => {
                if (input.type === 'address') {
                    params.push('vite_0000000000000000000000000000000000000000a4f3a0cb58');
                } else {
                    params.push('');
                }
            });
            return params;
        },
        async callContract (functionAbi) {
            try {
                functionAbi.status = 'CALLING';
                this.makeViewUpdate();

                await vite.sendContractTx(
                    this.account, 
                    this.contractAddress, 
                    this.abi, 
                    functionAbi.amount, 
                    functionAbi.abi.name, 
                    functionAbi.params
                );

                this.$message({
                    message: `Call "${functionAbi.abi.name}" success!`,
                    type: 'success'
                });
                functionAbi.status = 'BEFORE_CALL';
                this.makeViewUpdate();
            } catch (err) {
                throwError(err);
            }
          
        }
    }
};
</script>

<style lang="scss" scoped>
    i {
        cursor: handler;
    }
    .row {
        margin-bottom: 10px;
    }
    .call-button-wrapper {
        margin: 10px 0;
        text-align: center;            
    }

</style>
