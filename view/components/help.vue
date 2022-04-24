<template>
    <el-popover
        placement="bottom"
        trigger="click">
        <p class="el-text">{{ text }}</p>
        <i class="el-icon-question" slot="reference"></i>
    </el-popover>
</template>
<script>
export default {
    props: ['text'],

    methods: {
        showHelp() {
            this.$alert(this.text, {
                confirmButtonText: 'OK'
            });
        }
    }
};
</script>
<style lang="scss" scoped>
.el-text{
    max-width: 400px;
    margin: 5px;
}
.el-icon-question {
    font-size: 18px;
    color: #909399;
}
</style>
