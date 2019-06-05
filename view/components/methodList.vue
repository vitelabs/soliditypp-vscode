<template>
    <div>
        <h4 class="title">Call contract</h4>  
        <div  v-for="(functionAbi, functionAbiIndex) in functionAbiList" 
              :key="functionAbiIndex"
              v-loading="functionAbi.status === 'CALLING'"
              element-loading-text="calling"
              element-loading-background="rgba(0, 0, 0, 0.8)">

            <h5 class="title">
                <i class="el-icon-caret-bottom" @click="hideFunctionAbi(functionAbi)" v-if="functionAbi.isShow"></i>
                <i class="el-icon-caret-right"  @click="showFunctionAbi(functionAbi)" v-else></i>
                <template v-if="functionAbi.abi.type === 'offchain'">
                    offchain {{functionAbi.abi.name}}
                </template>
                <template v-else>
                    {{functionAbi.abi.name}}
                </template>
            </h5>
            <template v-if="functionAbi.isShow">
                <template v-if="functionAbi.hasAmount">
                    <el-row class="row" type="flex" justify="center" align="middle">
                        <el-col  :span="4" class="label">amount: </el-col>
                        <el-col  :span="18">
                            <el-input v-model="functionAbi.amount"></el-input>
                        </el-col>
                    </el-row>
                </template>

                <el-row class="row" type="flex" justify="center" align="middle" :key="input.name" v-for="(input, index) in functionAbi.abi.inputs">
                    <el-col :span="4" class="label">{{input.name}}</el-col>
    
                    <el-col :span="18">
                        <el-input v-model="functionAbi.params[index]"></el-input>
                    </el-col>
                </el-row>

                <template v-if="functionAbi.abi.type === 'offchain'">
                    <div class="call-button-wrapper">
                        <el-button @click="callOffchain(functionAbi)">call offchain "{{functionAbi.abi.name}}"</el-button>
                    </div>
                </template>
                <template v-else>
                    <div class="call-button-wrapper">
                        <el-button @click="callContract(functionAbi)">call "{{functionAbi.abi.name}}"</el-button>
                    </div>
                </template>
                <template v-if="functionAbi.result">
                    <el-row class="row" type="flex" justify="center" align="middle" :key="item.name" v-for="item in functionAbi.result">
                        <template v-if="item.name">
                            <div>{{item.name}}:</div>
                        </template>
                        <div>{{item.value}}</div>
                    </el-row>
                </template>
            </template>

        </div>
    </div>
</template>
<script>
import * as vite from 'global/vite';

export default {
    props: ['account', 'abi', 'contractAddress','offchainCode'],
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
                    hasAmount:true,
                    status: 'BEFORE_CALL',
                    abi: methodAbi,
                    params: this.getParams(methodAbi),
                    amount: '0',
                    result:[]
                });
            }

            if (methodAbi.type === 'offchain') {
                this.functionAbiList.push({
                    isShow: false,
                    hasAmount:false,
                    status: 'BEFORE_CALL',
                    abi: methodAbi,
                    params: this.getParams(methodAbi),
                    result:[]
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
            
                let contractTx = await vite.sendContractTx(
                    this.account, 
                    this.contractAddress, 
                    functionAbi.abi, 
                    functionAbi.amount, 
                    functionAbi.params
                );

                // query complete contract tx
                let client = vite.getVite();

                let contractBlock = await client.request('ledger_getBlockByHeight', contractTx.accountAddress, contractTx.height);
                
                this.$message({
                    message: `Call "${functionAbi.abi.name}" success!`,
                    type: 'success'
                });

                this.$emit('sendContractTx', {
                    abi: functionAbi.abi,
                    contractBlock: contractBlock
                });
            } catch (err) {
                this.$message({
                    message: `Call "${functionAbi.abi.name}" failed, error is ${JSON.stringify(err)}`,
                    type: 'error'
                });
            }

            functionAbi.status = 'BEFORE_CALL';
            this.makeViewUpdate();
        },
        async callOffchain (functionAbi) {
            try {
                functionAbi.status = 'CALLING';
                this.makeViewUpdate();
            
                let offchainResult = await vite.callOffchainMethod(
                    this.contractAddress, 
                    functionAbi.abi, 
                    this.offchainCode,
                    functionAbi.params
                );

                this.$message({
                    dangerouslyUseHTMLString: true,
                    message: `<div style="overflow-wrap: break-word;">Call offchain "${functionAbi.abi.name}" success!"${offchainResult}"</div>`,
                    type: 'success'
                });

                functionAbi.result = offchainResult;
            } catch (err) {
                this.$message({
                    dangerouslyUseHTMLString: true,
                    message: `<div style="overflow-wrap: break-word;">Call offchain "${functionAbi.abi.name}" failed, error is ${JSON.stringify(err)}</div>`,
                    type: 'error'
                });
            }

            functionAbi.status = 'BEFORE_CALL';
            this.makeViewUpdate();
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
