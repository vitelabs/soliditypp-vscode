<template>
    <div>
        <el-row class="select-row" type="flex" align="middle" v-if="callType">
            <el-col :span="5" class="prop-label">
                <el-select size="small" v-model="callType" class="selector">
                    <el-option value="function" v-if="functions.length > 0">function</el-option>
                    <el-option value="offchain" v-if="offchains.length > 0">offchain</el-option>
                </el-select>
            </el-col>

            <el-col :span="17" :offset="1" class="content">
                <el-select
                    size="small"
                    v-model="callingFunction"
                    class="selector"
                    v-if="callType === 'function'"
                >
                    <el-option
                        v-for="(abi, abiIndex) in functions"
                        :key="abiIndex"
                        :value="abi.name"
                    >{{abi.name}}</el-option>
                </el-select>

                <el-select
                    size="small"
                    v-model="callingOffchain"
                    class="selector"
                    v-if="callType === 'offchain'"
                >
                    <el-option
                        v-for="(abi, abiIndex) in offchains"
                        :key="abiIndex"
                        :value="abi.name"
                    >{{abi.name}}</el-option>
                </el-select>
            </el-col>
        </el-row>

        <!-- params -->
        <div class="params" v-if="hasCallingParams">
            <div class="minor-title">Parameters</div>
            <!-- amount -->
            <el-row
                class="select-row"
                v-if="callType === 'function' && callingParams"
                type="flex"
                align="middle"
                justify="center"
            >
                <el-col :span="4" class="prop-label">
                    <div>
                        amount
                        <help
                            text="The amount of vite token is transferred to contract. The basic unit of token is vite, the smallest
unit is attov, 1 vite = 1018 attov"
                        ></help>
                    </div>
                </el-col>

                <el-col :span="13" :offset="1">
                    <el-input size="small" v-model="callingParams.$$transfer"></el-input>
                </el-col>

                <el-col :span="4">
                    <units class="units" v-model="callingParams.$$transferUnits"></units>
                </el-col>
            </el-row>

            <!-- other params -->
            <el-row
                class="select-row"
                type="flex"
                justify="center"
                align="middle"
                :key="index"
                v-for="(input, index) in callingDeclaration.inputs"
            >
                <template v-if="callingParams">
                    <el-col :span="4" class="prop-label">
                        <div>{{input.name}}</div>
                        <div>({{input.type}})</div>
                    </el-col>

                    <el-col :span="17" :offset="1">
                        <el-input size="small" v-model="callingParams[input.name]"></el-input>
                    </el-col>
                </template>
            </el-row>
        </div>

        <!-- call -->
        <div class="button-wrapper">
            <el-button size="small" @click="call(sendCreateBlock.toAddress)">call</el-button>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import * as vite from 'global/vite';
import units from 'components/units';

function inputDefaultValue(type) {
    if (type.indexOf('uint') === 0 || type.indexOf('int') === 0) {
        return 0;
    }
    return '';
}

function toParamsArray(abi, paramsObject) {
    let paramsArray = [];
    abi.inputs.forEach(function(input) {
        paramsArray.push(paramsObject[input.name]);
    });
    return paramsArray;
}

export default {
    props: ['deployInfo', 'sendCreateBlock'],
    components: {
        units
    },
    data() {
        return {
            callingFunction: '',
            callingOffchain: '',
            callingParams: {},
            callType: ''
        };
    },
    created() {
    // init calling offchain
        if (this.functions.length > 0) {
            this.callingFunction = this.functions[0].name;
        }
        if (this.offchains.length > 0) {
            this.callingOffchain = this.offchains[0].name;
        }
        if (this.callingFunction) {
            this.callType = 'function';
        } else if (this.callingOffchain) {
            this.callType = 'offchain';
        }
    },
    computed: {
        constructors() {
            return this.getFunctionDeclarations('constructor');
        },
        functions() {
            return this.getFunctionDeclarations('function');
        },
        offchains() {
            return this.getFunctionDeclarations('offchain');
        },
        callingDeclaration() {
            if (!this.callType) {
                return null;
            }
            let declarations = this.getFunctionDeclarations(this.callType);
            let callingName;
            switch (this.callType) {
            case 'function':
                callingName = this.callingFunction;
                break;

            case 'offchain':
                callingName = this.callingOffchain;
                break;
            }
            if (!callingName) {
                return null;
            }
            for (let i = 0; i < declarations.length; i++) {
                if (declarations[i].name === callingName) {
                    return declarations[i];
                }
            }
            return null;
        },
        hasCallingParams() {
            if (!this.callType) {
                return false;
            }
            if (this.callType === 'function') {
                return true;
            }

            if (Object.keys(this.callingParams).length > 0) {
                return true;
            }
            return false;
        }
    },
    watch: {
        callingDeclaration: function() {
            this.callingParams = {};
            if (!this.callingDeclaration) {
                return;
            }

            let inputs = this.callingDeclaration.inputs;
            if (this.callType === 'function') {
                Vue.set(this.callingParams, '$$transfer', inputDefaultValue('uint256'));
                Vue.set(this.callingParams, '$$transferUnits', 'vite');
            }
            inputs.forEach(input => {
                Vue.set(this.callingParams, input.name, inputDefaultValue(input.type));
            });
        }
    },
    methods: {
        functionSignature(f) {
            let name = f.name;
            if (!name) {
                name = 'Constructor';
            }
            let signature = name + '(';
            f.inputs.forEach(function(input, index) {
                signature += input.type;
                if (index < f.inputs.length - 1) {
                    signature += ', ';
                }
            });

            return signature + ')';
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
        async call(contractAddress) {
            if (this.callType === 'function') {
                return await this.callFunction(contractAddress);
            } else if (this.callType === 'offchain') {
                return await this.callOffchain(contractAddress);
            }
        },

        async callFunction(contractAddress) {
            try {
                await vite.sendContractTx(
                    this.deployInfo.selectedAccount,
                    contractAddress,
                    this.callingDeclaration,

                    vite.transformViteBalance(
                        this.callingParams.$$transfer,
                        this.callingParams.$$transferUnits
                    ),
                    toParamsArray(this.callingDeclaration, this.callingParams)
                );
            } catch (err) {
                this.$store.commit('addLog', {
                    deployInfo: this.deployInfo,
                    title: 'send block failed',
                    log: err,
                    type: 'error'
                });

                return;
            }
        },

        async callOffchain(contractAddress) {
            let result;
            try {
                result = await vite.callOffchainMethod(
                    contractAddress,
                    this.callingDeclaration,
                    this.deployInfo.compileInfo.offchainCode,
                    toParamsArray(this.callingDeclaration, this.callingParams)
                );
            } catch (err) {
                this.$store.commit('addLog', {
                    deployInfo: this.deployInfo,

                    title: `call ${this.callingDeclaration.name} failed`,
                    log: err,
                    type: 'error'
                });
                return;
                // return;
            }

            this.$store.commit('addLog', {
                deployInfo: this.deployInfo,
                title: `call ${this.callingDeclaration.name}`,
                log: result,
                dataType: 'json'
            });
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