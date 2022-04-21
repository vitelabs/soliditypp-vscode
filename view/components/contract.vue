<template>
    <section class="contract-deploy">
        <!-- send token -->
        <dl>
            <dt class="minor-title">Send token to the contract</dt>
            <dd>
                <el-input size="small" v-model="contract.tokenId" value='tti_5649544520544f4b454e6e40'>
                    <template slot="prepend">token id</template>
                </el-input>
            </dd>
            <dd>
                <el-input size="small" v-model="contract.amount">
                    <template slot="prepend">amount</template>
                </el-input>
            </dd>
            <dd>
                <el-button type="primary" size="small" @click="sendToken(contract.toAddress, contract.amount, contract.tokenId)">send</el-button>
            </dd>
        </dl>
        <!-- functions -->
        <dl class="params" v-for="(func, funcIndex) in functions" :key="funcIndex">
            <dt class="minor-title">{{functionSignature(func)}}</dt>
            <!-- token -->
            <dd class="flex-container" v-if="func.stateMutability==='payable'">
                <el-input size="small" v-model="func.amount">
                    <template slot="prepend">amount</template>
                </el-input>
                <select-token class="units" v-model="func.token"></select-token>
                <token-units class="units" v-if="func.token" v-model="func.tokenUnit" :decimals="func.token.decimals || 0"></token-units>
            </dd>
            <!-- params -->
            <dd :key="index" v-for="(input, index) in func.inputs">
                <el-input size="small" v-model="input.value">
                    <template slot="prepend">{{input.name}} ({{input.type}})</template>
                </el-input>
            </dd>
            <!-- call -->
            <dd>
                <el-button type="warning" v-if="func.stateMutability === 'view' || func.stateMutability === 'pure'" class="el-button el-button--small" @click="callContract(contract.toAddress, func)">query {{func.name}}()</el-button>
                <el-button type="primary" v-else class="el-button el-button--small" @click="callContract(contract.toAddress, func)">call {{func.name}}()</el-button>
            </dd>
        </dl>
    </section>
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
        },
        async sendToken(addr, amount, tokenId) {
            const tti = tokenId ? tokenId : 'tti_5649544520544f4b454e6e40';
            try {
                console.log('send token', addr, amount, tti);
                await vite.sendToken(
                    this.selectedAccount,
                    addr,
                    amount,
                    tti
                );
            } catch (err) {
                this.$store.commit('addLog', {
                    deployInfo: this.deployInfo,
                    title: `failed to send token ${tti}`,
                    log: err,
                    type: 'error'
                });
                return;
            }
        }
    }
};
</script>

<style lang="scss" scoped>
.contract-deploy {
    padding: 0 20px;
}
dl {
    margin: 20px 0;
    width: 52%;
    dt,
    dd {
        margin: 10px 0;
    }
}

.minor-title {
  font-weight: 600;
  font-size: 13px;
}

.flex-container {
    display: flex;
}

.units {
  margin-left: 5px;
}
.select-row {
  margin-bottom: 10px;
}
</style>
