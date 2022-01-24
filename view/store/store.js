import Vue from 'vue';
import Vuex from 'vuex';
import dayjs from 'dayjs';
import * as vite from 'global/vite';
import WS_RPC from '@vite/vitejs-ws';
import { wallet } from '@vite/vitejs';
import { CUSTOM_NET_MAP } from 'global/constants';

import * as storage from 'utils/storage';

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

export const NET_MAPS = {
    debug: 'ws://localhost:23457',
    testnet: 'wss://buidl.vite.net/gvite/ws',
    mainnet: 'wss://node.vite.net/gvite/ws'
};

Vue.use(Vuex);
let mnemonicsDefault = storage.get('mnemonics');
if (!wallet.validateMnemonics(mnemonicsDefault)) {
    mnemonicsDefault = wallet.createMnemonics();
    storage.set('mnemonics', mnemonicsDefault);
}

const initialAccount = vite.createAccount(mnemonicsDefault, 0);
const enableVc = !!storage.get('enableVc');
const initCustomNetsMap = storage.get(CUSTOM_NET_MAP);

const store = new Vuex.Store({
    state: {
        snapshotHeight: 1,
        deployInfoList: [],
        compileResult: null,
        vcConnected: false, // vc connect status
        accounts: [initialAccount],
        selectedAddress: initialAccount.address,
        accountStates: {},
        netType: 'debug', // debug(local debug network) / testnet(vite testnet) / mainnet(vite mainnet)
        contracts: [],
        mnemonics: mnemonicsDefault,
        enableVc,
        dynamicNetMap: { ...NET_MAPS,...initCustomNetsMap }
    },
    getters: {
        addressMap(state, getters) {
            let ob = {};
            getters.accountsFilter.forEach(item => {
                ob[item.address] = item;
                ob[item.address].accountState =
                    state.accountStates[item.address];
            });
            return ob;
        },
        accountsFilter(state) {
            const { enableVc } = state;
            if (!enableVc) {
                return state.accounts.filter(item => item.type === 'local');
            }
            return state.accounts.filter(item => item.type === 'vc');
        },
        selectedAccount(state, getters) {
            return getters.addressMap[state.selectedAddress] || {};
        },
        currentNode(state) {
            return state.dynamicNetMap[state.netType];
        },
        isDebugEnv(state) {
            return state.netType === 'debug';
        },
        netTypeList() {
            return ['debug', 'testnet', 'mainnet', 'custom'];
        }
    },
    mutations: {
        setDynamicNetItem(state, { url, name }) {
            state.dynamicNetMap[name] = url;
        },
        setCompileResult(state, { compileResult }) {
            state.compileResult = compileResult;
        },

        setNetType(state, netType) {
            state.netType = netType;
        },
        setVcConnected(state, status) {
            state.vcConnected = status;
        },

        setEnableVc(state, status) {
            state.enableVc = !!status;
        },

        init(state, { compileResult }) {
            let deployInfoList = [];

            for (let i = 0; i < compileResult.abiList.length; i++) {
                let compileInfo = {
                    abi: compileResult.abiList[i],
                    bytecodes: compileResult.bytecodesList[i],
                    contractName: compileResult.contractNameList[i],
                    asm:compileResult.asmList[i]
                };

                let deployInfo = {
                    index: i,
                    compileInfo,
                    logs: [],
                    contracts: []
                };

                deployInfoList.push(deployInfo);
            }

            state.deployInfoList = deployInfoList;
        },

        setMnemonics(state, payload) {
            state.mnemonics = payload;
        },

        addAccount(state, { account }) {
            state.accounts = state.accounts.concat([account]);
        },

        setAccounts(state, accounts) {
            state.accounts = accounts;
        },

        setSelectedAddress(state, address) {
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
        deployed(state, { contract, contractName }) {
            //             contractAddress: contractBlock.toAddress,
            //             contractBlock,
            //             abi,
            //             contractName,
            //             offchainCode
            state.contracts = state.contracts.concat([
                {
                    ...contract,
                    contractName
                }
            ]);
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
            if (netType !== state.netType) {
                commit('setNetType', netType);
                commit(
                    'setSelectedAddress',
                    getters.accountsFilter[0] &&
                        getters.accountsFilter[0].address
                );
                vite.getVite().setProvider(
                    new WS_RPC(getters.currentNode, 60000),
                    () => {
                        console.log(
                            `connect to ${getters.currentNode} success.`
                        );
                    },
                    true
                );
            }
        },
        addAccount({ commit }, newAccount) {
            commit('addAccount', { account: newAccount });
            commit('setSelectedAddress', newAccount.address);
        },
        importWallet({ commit, state }, payload) {
            if (payload === state.mnemonics) {
                return;
            }
            commit('setMnemonics', payload);
            storage.set('mnemonics', payload);
            let newAccount = vite.createAccount(payload, 0);
            commit('setAccounts', [newAccount]);
            commit('setSelectedAddress', newAccount.address);
        },
        enableVc({ commit }, status) {
            commit('setEnableVc', status);
            storage.set('enableVc', !!status);
        },
        updateDynamicNetItem({ commit }, { name, url }) {
            const customNetsMap = storage.get(CUSTOM_NET_MAP);
            storage.set(CUSTOM_NET_MAP,{...customNetsMap,[name]:url});
            commit('setDynamicNetItem', { name, url });
        }
    }
});

export default store;
