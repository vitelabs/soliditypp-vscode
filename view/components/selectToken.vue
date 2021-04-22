<template>
    <el-select size="small" v-model="selectedToken" filterable placeholder="Token" @change="onChange">
        <el-option
            v-for="item in tokens"
            :key="item.tokenId"
            :label="item.tokenSymbol"
            :value="item.tokenId"
        >
        </el-option>
    </el-select>
</template>

<script>
import * as vite from 'global/vite';

export default {
    props: ['value'],
    data() {
        return {
            tokens: [],
            selectedToken: ''
        };
    },
    beforeMount() {
        this.getTokenList();
    },
    methods: {
        async getTokenList() {
            const data = await vite.getVite().request('contract_getTokenInfoList', 0, 1000);
            let tokenList = data.tokenInfoList;
            tokenList = tokenList.map(item => {
                let tokenIndex = item.index + '';
                if (tokenIndex.length ===  1) {
                    tokenIndex = '00' + tokenIndex;
                }
                if (tokenIndex.length === 2) {
                    tokenIndex = '0' + tokenIndex; 
                }
                return {
                    ...item,
                    tokenSymbol: `${item.tokenSymbol}-${tokenIndex}`
                };
            });
            this.tokens = tokenList;
        },
        onChange() {
            const token = this.tokens.find((item) => {
                return item.tokenId === this.selectedToken;
            });
            this.$emit('input', {...token});
        }
    }
};
</script>

<style lang="sass" scoped>
</style>