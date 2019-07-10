<template>
    <div>
        <el-collapse class="deployed-contract-list">
            <el-collapse-item
                v-for="(sendCreateBlock,index) in deployInfo.sendCreateBlocks"
                :key="index"
                :title="sendCreateBlock.toAddress"
            >
                <contract :deploy-info="deployInfo" :send-create-block="sendCreateBlock"></contract>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>

<script>
import contract from 'components/contract';

export default {
    props: ['deployInfo'],
    components: { contract }
};
</script>

