<template>
    <div>
        <!-- functions -->
        <div class="params" v-for="(func, funcIndex) in functions" :key="funcIndex">
            <div class="minor-title">{{functionSignature(func)}}</div>
            <!-- token -->
            <el-row
                class="select-row"
                type="flex"
                align="middle"
                justify="center"
                v-if="func.stateMutability==='payable'"
            >
                <el-col :span="4" class="label">
                    <div>
                        amount
                    </div>
                </el-col>

                <el-col :span="9" :offset="1">
                    <el-input size="small" v-model="func.amount"></el-input>
                </el-col>

                <el-col :span="4">
                    <select-token class="units" v-model="func.token"></select-token>
                </el-col>

                <el-col :span="4">
                    <token-units class="units" v-if="func.token" v-model="func.tokenUnit" :decimals="func.token.decimals || 0"></token-units>
                </el-col>
            </el-row>
            <!-- params -->
            <el-row
                class="select-row"
                type="flex"
                justify="center"
                align="middle"
                :key="index"
                v-for="(input, index) in func.inputs"
            >
                <template>
                    <el-col :span="4" class="label">
                        <div>{{input.name}} ({{input.type}})</div>
                    </el-col>

                    <el-col :span="17" :offset="1">
                        <el-input size="small" v-model="input.value"></el-input>
                    </el-col>
                </template>
            </el-row>
            <!-- call -->
            <div class="button-wrapper">
                <el-button v-if="func.stateMutability === 'view' || func.stateMutability === 'pure'" class="el-button el-button--small" @click="callContract(contract.toAddress, func)">query {{func.name}}()</el-button>
                <el-button v-else class="el-button el-button--primary el-button--small" @click="callContract(contract.toAddress, func)">call {{func.name}}()</el-button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as vite from 'global/vite';
import selectToken from 'components/selectToken';
import tokenUnits from 'components/tokenUnits';

function inputDefaultValue(type) {
    if (type.indexOf('uint') === 0 || type.indexOf('int') === 0)
        return 0;
    else if (type.indexOf('bool') === 0)
        return false;

    return '';
}

function toParamsArray(params) {
    let result = [];
    const isArr = /^\w+(\[\d*\])+$/g;
    params.inputs.forEach(function(input) {
        const value = input.value ? input.value : inputDefaultValue(input.type);
        if (isArr.test(input.type)) {
            result.push(JSON.parse(value));
        } else if (input.type.indexOf('bool') === 0) {
            const b = (/^(true|1)$/i).test(value.toLowerCase().trim());
            result.push(b);
        } else {
            result.push(value);
        }
    });
    return result;
}

export default {
    props: ['deployInfo', 'contract'],
    components: {
        selectToken,
        tokenUnits
    },
    data() {
        return {
            abi: {}
        };
    },
    created() {

    },
    computed: {
        ...mapGetters(['selectedAccount']),
        constructors() {
            return this.getFunctionDeclarations('constructor');
        },
        functions() {
            return this.getFunctionDeclarations('function');
        },
        offchains() {
            return this.getFunctionDeclarations('offchain');
        }
    },
    watch: {
    },
    methods: {
        functionSignature(f) {
            let name = f.name;
            if (!name) {
                name = 'constructor';
            }
            let signature = 'function ' + name + '(';
            f.inputs.forEach(function(input, index) {
                signature += input.type;
                if (index < f.inputs.length - 1) {
                    signature += ', ';
                }
            });
            signature += ')';
            if (f.stateMutability) {
                signature += ' ' + f.stateMutability;
            }

            return signature;
        },
        getFunctionDeclarations(declarationType) {
            if (!this.deployInfo) {
                return [];
            }
            let declarations = [];

            this.deployInfo.compileInfo.abi.forEach(function(item) {
                if (item.type === declarationType) {
                    declarations.push(item);
                }
            });

            return declarations;
        },
        async callContract(addr, func) {
            try {
                let amount = vite.transformTokenAmount(func.amount || 0, func.tokenUnit);
                let tokenId = func.token ? func.token.tokenId : 'tti_5649544520544f4b454e6e40';
                let params = toParamsArray(func);

                console.log('call contract', addr, params, amount, tokenId, func);
                if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
                    // call contract without creating a transaction
                    console.log('call contract without creating a transaction');
                    let result = await vite.callContract(addr, func, params);
                    console.log('result', result);
                    let sig = this.functionSignature(func);
                    this.$store.commit('addLog', {
                        deployInfo: this.deployInfo,
                        title: `return of ${sig}`,
                        log: result,
                        dataType: 'json'
                    });
                } else {
                    // call contract by sending a transaction
                    console.log('call contract by sending a transaction');
                    await vite.sendContractTx(
                        this.selectedAccount,
                        addr,
                        func,
                        amount,
                        params,
                        tokenId
                    );
                }
            } catch (err) {
                this.$store.commit('addLog', {
                    deployInfo: this.deployInfo,
                    title: `call ${func.name} failed`,
                    log: err,
                    type: 'error'
                });
                return;
            }
        }
    }
};
</script>

<style lang="scss">
.deployed-contract-list {
  .el-collapse-item__header,
  .el-collapse-item__wrap {
    padding: 0 10px;
  }
}

.minor-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 10px;
}

.label {
  text-align: center;
  font-size: 12px;
}

.button-wrapper {
  text-align: center;
  margin-top: 20px;
}

.selector {
  width: 100%;
}

.units {
  margin-left: 5px;
}
.select-row {
  margin-bottom: 10px;
}
</style>