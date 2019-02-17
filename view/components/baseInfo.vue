<template>
    <div class="module-wrapper">
        <h4 class="title">Base information</h4>  
        <el-row type="flex" justify="center" class="row" v-if="accountList">
            <el-col class="key-col" :span="4">
                account
                <i class="el-icon-circle-plus add-account" @click="addAccount"></i>
                :
            </el-col>

            <el-col class="col" :span="18">
                <el-select class="select-address" v-model="selectedAccountAddress" size="small">
                    <el-option
                        v-for="account in accountList"
                        :key="account.address"
                        :label="account.address"
                        :value="account.address">
                    </el-option>
                </el-select>
                
            </el-col>
        </el-row>

        <el-row type="flex" justify="center" class="row" v-if="contractAddress">
            <el-col class="key-col" :span="4">
                contract:
            </el-col>

            <el-col class="col" :span="18">{{contractAddress}}</el-col>
        </el-row>
    </div>
</template>
<script>
import * as vite from 'global/vite';
export default {
    props: ['contractAddress', 'selectedAccount'],
    data () {
        return {
            accountList: []
        };
    },
    computed: {
        selectedAccountAddress: {
            get () {
                if (!this.selectedAccount) {
                    return '';
                }
                return this.selectedAccount.address;
            },
            set (val) {
                this.selectedAccount = this.accountList.find(function (account) {
                    return account.address === val;
                });
            }
        }
    },
    created () {
        if (this.selectedAccount) {
            this.accountList.push(this.selectedAccount);
        }
    },
    methods: {
        addAccount () {
            let account = vite.createAccount();
            this.accountList.push(account);
            console.log(this.selectedAccount);
        }
    }
};
</script>
<style lang="scss" scoped>
    .row{
        padding-bottom: 10px;
    }

    .key-col {
        text-align: center;   
    }

    .col {
        word-break: break-all;
    }
    .add-account:hover {
         cursor: pointer;
    }
    .select-address {
        width: 100%;
    }
</style>
