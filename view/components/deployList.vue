<template>
    <div class="module-wrapper">
        <h4 class="title">Deploy contract</h4>    
        <div :key="index" v-for = "(abi, index) in compileResult.abiList" >
            <h5 class="title">
                <i class="el-icon-caret-bottom"></i>
                <i class="el-icon-caret-right"></i>
                {{compileResult.contractNameList[index]}}
            </h5>    
            <deploy :abi="abi" :bytecodes="compileResult.bytecodesList[index]" @deployed="deployed"> </deploy>            
        </div>
    </div>
</template>
    
<script>
import deploy from './deploy';
export default {
    components: {
        deploy
    },
    props: ['compileResult'],
    methods: {
        deployed (contractAddress) {
            this.$emit('deployed', contractAddress);
        }
    }
};
</script>

<style lang="scss">
    
</style>
