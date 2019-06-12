import Vue from 'vue';
import Vuex from 'vuex';

// deployInfo:
// var deployInfo = {
//     compileInfo: '',
//     selectedAccount: '',
//     accounts: [], // [viteAccount]
//     contractList: [] // [contractList]
// };

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        deployInfoList: []
    },
    mutations: {
        init(state, compileResult) {
            let deployInfoList = [];
            for (let i = 0; i < compileResult.abiList.length; i++) {
                let compileInfo = {
                    abi: compileResult.abiList[i],
                    bytecodes: compileResult.bytecodesList[i],
                    contractName: compileResult.contractNameList[i],
                    offchainCode: compileResult.offchainCodesList[i]
                };
                deployInfoList.push({
                    compileInfo
                });
            }

            state.deployInfoList = deployInfoList;
        }
    }
});

export default store;
