<template>
    <el-row>
        <h2>Setting</h2>
        <el-form label-width="150px">
            <el-form-item label="Mnemonics Words:">
                <el-alert
                    title="If you want import a mnemonics words, please input mnemonics words bellow:"
                    style="margin-bottom:20px;"
                    type="info">
                </el-alert>
                <el-input type="textarea" v-model="mnemonicsInput" style="margin-bottom: 20px;"></el-input>
                <el-button type="primary" @click="generateNew" plain>Generate a new mnemonics</el-button>
            </el-form-item>
            <el-form-item label="Enable Vite Connect">
                <el-switch v-model="enableVcInput"></el-switch>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onSubmit">Save</el-button>
            </el-form-item>
        </el-form>
    </el-row>
</template>

<script>
import { mapState } from 'vuex';
import { wallet } from '@vite/vitejs';

export default {
    data() {
        return {
            mnemonicsInput: '',
            enableVcInput: false
        };
    },
    computed: {
        ...mapState(['mnemonics', 'enableVc']),
    },
    mounted() {
        this.mnemonicsInput = this.mnemonics;
        this.enableVcInput = this.enableVc;
    },
    watch: {
        mnemonics(value) {
            this.mnemonicsInput = value;
        }
    },
    methods: {
        onSubmit() {
            if (!wallet.validateMnemonics(this.mnemonicsInput)) {
                return this.$message.error('Please input a valid mnemonics words.');
            }

            this.$store.dispatch('importWallet', this.mnemonicsInput);
            this.$store.dispatch('enableVc', this.enableVcInput);

            this.$message.success('Saved');
        },
        generateNew() {
            this.mnemonicsInput = wallet.createMnemonics();
            this.$message.success('Successfuly generate a new mnemonics, please click save button to take effect.');
        }
    }
};
</script>

<style lang="scss" scope>
    
</style>