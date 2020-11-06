import Vue from 'vue';
import Vuex from 'vuex';
import dayjs from 'dayjs';
import * as vite from 'global/vite';

// deployInfo:
// var deployInfo = {
//     compileInfo: '',
//     selectedAccount: '',
//     selectedAccountAddress: '',
//     accounts: [], // [viteAccount]
//     contractList: [] // [contractList]
//     logs: []
// };

Vue.use(Vuex);
const initialAccount = vite.createAccount();

const store = new Vuex.Store({
    state: {
        snapshotHeight: 1,
        deployInfoList: [],
        compileResult: null,
        loginAddress: null,    // vc login wallet address
        accounts: [initialAccount],
        selectedAddress: initialAccount.address,
        accountStates: {},
    },
    getters: {
        addressMap(state) {
            let ob = {};
            state.accounts.forEach(item => {
                ob[item.address] = item;
                ob[item.address].accountState = state.accountStates[item.address];
            });
            return ob;
        },
        selectedAccount(state, getters) {
            return getters.addressMap[state.selectedAddress];
        }
    },
    mutations: {
        setCompileResult(state, { compileResult }) {
            state.compileResult = compileResult;
        },

        setLoginAddress(state, { address }) {
            state.loginAddress = address;
        },

        init(state, { compileResult }) {
            let deployInfoList = [];

            for (let i = 0; i < compileResult.abiList.length; i++) {
                let compileInfo = {
                    abi: compileResult.abiList[i],
                    bytecodes: compileResult.bytecodesList[i],

                    contractName: compileResult.contractNameList[i],
                    offchainCode: compileResult.offchainCodesList[i]
                };

                let deployInfo = {
                    index: i,
                    compileInfo,
                    sendCreateBlocks: [],
                    logs: []
                };

                deployInfoList.push(deployInfo);
            }

            state.deployInfoList = deployInfoList;
        },

        addAccount(state, { account }) {
            state.accounts = state.accounts.concat([account]);
        },

        setSelectedAddress(state, { address }) {
            state.selectedAddress = address;
        },

        updateAccountState(state, { address, accountState }) {
            state.accountStates = {
                ...state.accountStates,
                [address]: accountState
            };
        },

        updateSnapshotHeight(state, { snapshotHeight }) {
            state.snapshotHeight = snapshotHeight;
        },

        // deployInfo: this.deployInfo,
        // sendCreateBlock: createContractBlock
        deployed(state, { deployInfo, sendCreateBlock }) {
            //             contractAddress: contractBlock.toAddress,
            //             contractBlock,
            //             abi,
            //             contractName,
            //             offchainCode
            deployInfo.sendCreateBlocks.push(sendCreateBlock);
        },

        addLog(
            state,
            { deployInfo, log, title = '', type = 'info', dataType = 'text' }
        ) {
            let content = log;
            if (type === 'error') {
                if (content.stack) {
                    content = log.toString();
                } else {
                    content = JSON.stringify(content);
                }
            }
            console.log(type);
            deployInfo.logs.push({
                createdTime: dayjs(),
                title: title,
                content: content,
                type,
                dataType
            });
        }
    }
});

export default store;
