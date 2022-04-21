<template>
    <el-form label-position="right" ref="form" label-width="70px">
        <el-form-item label="Address">
            {{account.address}}
        </el-form-item>
        <el-form-item label="Amount">
            <el-input class="amount" v-model="amount">
                <template slot="append">
                    <units class="units" v-model="amountUnits"></units>
                </template>
            </el-input>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="transfer">transfer</el-button>
        </el-form-item>
    </el-form>
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
.amount {
    width: 360px;
}
.units {
    width: 90px;
}
</style>
