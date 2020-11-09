<template>
    <div>
        <el-collapse class="deployed-contract-list" v-model="activeNames">
            <el-collapse-item
                v-for="(sendCreateBlock,index) in deployInfo.sendCreateBlocks"
                :key="index"
                :title="`Contract #${index + 1}: ${sendCreateBlock.toAddress}`"
                :name="index"
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
    components: { contract },
    data() {
        return {
            activeNames: 0,
        };
    }
};
</script>

