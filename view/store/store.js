import Vue from 'vue';
import Vuex from 'vuex';
import dayjs from 'dayjs';
import * as vite from 'global/vite';
import WS_RPC from '@vite/vitejs-ws';

/*
    deployInfo struct:
    
    var deployInfo = {
        compileInfo: '',
        selectedAccount: '',
        selectedAccountAddress: '',
        accounts: [], // [viteAccount]
        contractList: [] // [contractList]
        logs: []
    };
*/

const NET_MAPS = {
    debug: 'ws://localhost:23457',
    testnet: 'wss://node.vite.net/test/gvite/ws',
    mainnet: 'wss://node.vite.net/gvite/ws'
};

Vue.use(Vuex);
const initialAccount = vite.createAccount();

const store = new Vuex.Store({
    state: {
        snapshotHeight: 1,
        deployInfoList: [],
        compileResult: null,
        vcConnected: false,    // vc connect status
        accounts: [initialAccount],
        selectedAddress: initialAccount.address,
        accountStates: {},
        netType: 'debug',     // debug(local debug network) / testnet(vite testnet) / mainnet(vite mainnet)
        customNode: null
    },
    getters: {
        addressMap(state, getters) {
            let ob = {};
            getters.accountsFilter.forEach(item => {
                ob[item.address] = item;
                ob[item.address].accountState = state.accountStates[item.address];
            });
            return ob;
        },
        accountsFilter(state) {
            const { netType } = state;
            if (netType === 'debug') {
                return state.accounts.filter(item => item.type === 'local');
            }
            return state.accounts.filter(item => item.type === 'vc');
        },
        selectedAccount(state, getters) {
            return getters.addressMap[state.selectedAddress] || {};
        },
        currentNode(state) {
            return state.customNode ? state.customNode : NET_MAPS[state.netType];
        },
        isDebugEnv(state) {
            return state.netType === 'debug';
        },
        netTypeList() {
            return ['debug', 'testnet', 'mainnet'];
        }
    },
    mutations: {
        setCompileResult(state, { compileResult }) {
            state.compileResult = compileResult;
        },

        setNetType(state, netType) {
            state.netType = netType;
        },

        setCustomNode(state, customNode) {
            state.customNode = customNode;
        },

        setVcConnected(state, status) {
            state.vcConnected = status;
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
    },

    actions: {
        changeNetType({ state, getters, commit }, netType) {
            if ( netType !== state.netType) {
                commit('setNetType', netType);
                commit('setSelectedAddress', { address: getters.accountsFilter[0] });
                vite.getVite().setProvider(new WS_RPC(getters.currentNode, 60000), () => {
                    console.log(`connect to ${getters.currentNode} success.`);
                }, true);
            }
        },
        addAccount({ commit }, newAccount) {
            commit('addAccount', { account: newAccount });
            commit('setSelectedAddress', newAccount);
        }
    }
});

export default store;
