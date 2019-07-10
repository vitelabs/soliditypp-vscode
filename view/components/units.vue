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
            selectValue: ''
        };
    },
    watch: {
        selectValue(val) {
            this.$emit('update', val);
        }
    },
    mounted() {
        if (this.value) {
            this.selectValue = this.value;
        } else {
            this.selectValue = 'vite';
        }
    }
};
</script>
<style lang="scss">
</style>