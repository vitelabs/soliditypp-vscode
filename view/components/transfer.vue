<template>
    <div>
        <el-row type="flex" align="middle" class="row">
            <el-col class="key-col col no-border label" :span="5">address</el-col>
            <el-col class="key-col col no-border" :span="16">{{account.address}}</el-col>
        </el-row>

        <el-row type="flex" align="middle" class="row">
            <el-col class="key-col col no-border label" :span="5">amount</el-col>
            <el-col class="key-col col no-border" :span="15">
                <el-input size="small" v-model="amount"></el-input>
            </el-col>
            <el-col :span="4">
                <units class="units" v-model="amountUnits"></units>
            </el-col>
        </el-row>

        <div class="button-wrapper">
            <el-button @click="transfer">transfer</el-button>
        </div>
    </div>
</template>

<script>
import * as vite from 'global/vite';

import units from 'components/units';

export default {
    props: ['account'],
    components: {
        units
    },
    data() {
        return {
            amount: 0,
            amountUnits: ''
        };
    },
    methods: {
        async transfer() {
            let result;
            let resultErr;
            try {
                console.log(this.amountUnits);
                result = await vite.transfer(
                    this.account,
                    vite.transformViteBalance(this.amount, this.amountUnits)
                );
            } catch (err) {
                resultErr = err;
            }

            this.$emit('afterTransfer', {
                amount: this.amount,
                amountUnits: this.amountUnits,
                result: result,
                error: resultErr
            });
        }
    }
};
</script>

<style lang="scss" scoped>
.label {
  text-align: center;
}
.row {
  margin: 10px 0;
}
.button-wrapper {
  text-align: center;
}
.units {
  margin-left: 5px;
}
</style>