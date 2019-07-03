<template>
    <div class="module-wrapper">
        <h4 class="title">Transfer</h4>

        <el-row type="flex" justify="center" class="row">
            <el-col class="key-col col no-border label" :span="4">address</el-col>
            <el-col class="key-col col no-border" :span="20">
                <el-input v-model="address"></el-input>
            </el-col>
        </el-row>

        <el-row type="flex" justify="center" class="row">
            <el-col class="key-col col no-border label" :span="4">amount</el-col>
            <el-col class="key-col col no-border" :span="20">
                <el-input v-model="amount"></el-input>
            </el-col>
        </el-row>

        <el-row type="flex" justify="center" class="row">
            <el-col class="key-col col no-border" :span="8">
                <el-button @click="transfer">transfer</el-button>
            </el-col>
        </el-row>

        <el-row type="flex" justify="center" class="row">
            <el-col class="key-col col no-border" :span="24">
                <div>{{result}}</div>
            <el-col>
        </el-row>
    </div>
</template>

<script>
import * as vite from 'global/vite';

export default {
    data () {
        return {
            address: '',
            amount: 0,
            result: '',
            pending: false,
        };
    },
    methods: {
        transfer() {
            if (this.pending) {
                return
            }

            this.pending = true
            this.result = 'transfer pending'

            vite.transfer(this.address, this.amount).then(res => {
                console.log(res)

                this.result = 'transfer success'
                this.pending = false
            }, err => {
                console.error(err)

                this.result = 'transfer failed: ' + JSON.stringify(err)
                this.pending = false
            })
        },
    }
};
</script>

<style lang="scss" scoped>
.label {
    text-align: center;    
}
.row {
    margin: 0px 10px 10px 10px;
}
</style>