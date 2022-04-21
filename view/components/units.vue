<template>
    <el-select :style="{width: width}" v-model="selectValue">
        <el-option value="vite">vite</el-option>
        <el-option value="attov">attov</el-option>
    </el-select>
</template>
<script>
export default {
    props: {
        value: String,
        width: {
            type: String,
            default: '70px'
        },
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
