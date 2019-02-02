<template>
    <div class="module-wrapper">
        <h4 class="title">Base information</h4>  
        <el-row type="flex" justify="center" class="row" v-if="account">
            <el-col class="key-col" :span="4">
                account:
            </el-col>
            <el-col class="col" :span="18">{{account.address}}</el-col>
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
export default {
    props: ['account', 'contractAddress']
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
</style>
