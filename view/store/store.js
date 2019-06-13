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
        init(state, { compileResult, initAccounts }) {
            let deployInfoList = [];
            console.log(initAccounts);
            for (let i = 0; i < compileResult.abiList.length; i++) {
                let compileInfo = {
                    abi: compileResult.abiList[i],
                    bytecodes: compileResult.bytecodesList[i],
                    contractName: compileResult.contractNameList[i],
                    offchainCode: compileResult.offchainCodesList[i]
                };

                deployInfoList.push({
                    compileInfo,
                    accounts: [initAccounts[i]],
                    selectedAccount: initAccounts[i]
                });
            }

            state.deployInfoList = deployInfoList;
        },

        addAccount(state, { index, account }) {
            state.deployInfoList[index].accounts.push(account);
        },

        selectAccount(state, { index, account }) {
            state.deployInfoList[index].selectedAccount = account;
        }
    }
});

export default store;
