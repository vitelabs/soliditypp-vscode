<template>
    <i class="el-icon-question" @click="showHelp"></i>
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
<style lang="scss">
</style>