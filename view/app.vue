<template>
    <div>
    
        <el-form v-if="testAccount" label-width="80px">
            <el-form-item label="account:">
                <el-form-item :label="testAccount.address">
                </el-form-item>
            </el-form-item>
        </el-form>

        <el-form v-if="abi" label="deploy" label-width="80px">
            <el-form-item label="amount:">
                <el-input v-model="deployAmount"></el-input>
            </el-form-item>
            <template v-if="constructAbi" >

                <template v-for="(input, index) in constructAbi.inputs">
                    <el-form-item :key="input.name" :label="input.name + ':'">
                        <el-input v-model="deployParams[index]"></el-input>
                    </el-form-item>    
                </template>
            </template>
            <el-form-item>            
                <el-button @click="deployContract">deploy</el-button>
            </el-form-item>
        </el-form>         
        {{functionAbiList}}
        <el-tree
            v-if="functionAbiList"
            :data="functionAbiList"
            node-key="name"
        >
        </el-tree>    
    </div>
</template>

<script>
import getCompileResult from 'services/compile';
import * as vite from 'global/vite';

export default {
    data () {
        return {
            compileResult: undefined,
            testAccount: undefined,
            deployParams: [],
            deployAmount: 0,
            deployStatus: 0 // 0 mean no deploy, 1 mean deploying, 2 mean deployed
        };
    },

    computed: {
        abiList () {
            if (!this.compileResult) {
                return undefined;
            }
            return this.compileResult.abiList;

        },
        abi () {
            if (!this.abiList) {
                return undefined;
            }
            return this.abiList[0];
        },

        bytecodes () {
            if (!this.compileResult) {
                return undefined;
            }
            return this.compileResult.bytecodesList[0];
        },

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
        },


        functionAbiList () {
            if (!this.abi) {
                return undefined;
            }

    
            let list = [];
            for (let i = 0; i < this.abi.length; i++) {
                let methodAbi = this.abi[i];
                
                if (methodAbi.type === 'function') {
                    list.push(methodAbi);
                }
            }
            console.log(list);
            return list;
        }
    },

    async created () { 
        let compileResult = await getCompileResult();
        this.compileResult = compileResult;

        this.initDeployParams();
        await vite.init(compileResult);
        this.testAccount = vite.getTestAccount();
    },
    methods: {
        initDeployParams () {
            if (!this.constructAbi) {
                return;
            }
            this.deployParams = [];
            this.constructAbi.inputs.forEach((input) => {
                if (input.type === 'address') {
                    this.deployParams.push('vite_0000000000000000000000000000000000000000a4f3a0cb58');
                } else {
                    this.deployParams.push('');
                }
                
            });
        },

        changeDeployParams (index, event) {
            console.log(event);
            this.deployParams[index] = event.value;
        },

        cleanDeployParams () {
            
        },

        async deployContract () {
            console.log(this.deployParams);
            this.deployStatus = 1;
            await vite.createContract(vite.getTestAccount(), {
                bytecodes: this.bytecodes,
                abi: this.abi
            }, this.deployAmount, this.deployParams);
            this.deployStatus = 2;
        }
    }
    
};
</script>

<style lang="scss">
</style>