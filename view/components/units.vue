<template>
    <div>
        <el-select v-model="selectValue" size="small">
            <el-option value="vite">vite</el-option>
            <el-option value="attov">attov</el-option>
        </el-select>
    </div>
</template>
<script>
export default {
    props: {
        value: String
    },
    model: {
        prop: 'value',
        event: 'update'
    },
    data: function() {
        return {
            selectValue: 'vite'
        };
    },
    watch: {
        selectValue(val) {
            this.$emit('update', val);
        }
    },
    created() {
        if (this.value) {
            this.selectValue = this.value;
        }
    }
};
</script>
<style lang="scss">
</style>