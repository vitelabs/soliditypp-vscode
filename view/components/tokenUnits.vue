<template>
    <div>
        <el-select v-model="selectValue" size="small">
            <el-option v-for="(item, index) in options" :key="index" :value="item.value" :label="item.label"></el-option>
        </el-select>
    </div>
</template>
<script>
export default {
    props: {
        value: Number,
        decimals: Number
    },
    model: {
        prop: 'value',
        event: 'update'
    },
    data: function() {
        return {
            selectValue: 0
        };
    },
    computed: {
        options() {
            let opts = [];
            const decimals = this.decimals || 0;
            for(let i = decimals; i >= 0 ; i--) {
                opts.push({
                    value: i,
                    label: `10^${i}`
                });
            }
            return opts;
        }
    },
    watch: {
        value(val) {
            if (val !== this.selectValue) {
                this.selectValue = val || 0;
            }
        },
        decimals() {
            this.selectValue = this.decimals || 0;
        },
        selectValue(val) {
            this.$emit('update', val);
        }
    }
};
</script>
<style lang="scss">
</style>