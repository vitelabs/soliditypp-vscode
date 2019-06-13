import Vue from 'vue';
import Vuex from 'vuex';

// deployInfo:
// var deployInfo = {
//     compileInfo: '',
//     selectedAccount: '',
//     selectedAccountAddress: '',
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
                    selectedAccount: initAccounts[i],
                    selectedAccountAddress: initAccounts[i].address
                });
            }

            state.deployInfoList = deployInfoList;
        },

        addAccount(state, { index, account }) {
            state.deployInfoList[index].accounts.push(account);
        },

        selectAccount(state, { index, address }) {
            let deployInfo = state.deployInfoList[index];
            let accounts = deployInfo.accounts;
            for (let account of accounts) {
                if (address === account.address) {
                    deployInfo.selectedAccountAddress = address;
                    deployInfo.selectedAccount = account;
                    break;
                }
            }
        }
    }
});

export default store;
