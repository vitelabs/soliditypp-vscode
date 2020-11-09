<template>
    <el-container class="app-wrapper">
        <el-aside width="64px" class="menu-wrapper">
            <el-menu default-active="/debug" :collapse="true" :router="true">
                <el-menu-item index="/debug">
                    <i class="el-icon-menu"></i>
                    <span slot="title">Debug</span>
                </el-menu-item>
                <el-menu-item index="/publish">
                    <i class="el-icon-upload"></i>
                    <span slot="title">Publish</span>
                </el-menu-item>
            </el-menu>
        </el-aside>
        <el-main class="main-layout">
            <keep-alive v-if="isReady">
                <router-view></router-view>
            </keep-alive>
        </el-main>
    </el-container>
</template>

<script>
import { mapGetters } from 'vuex';
import getCompileResult from 'services/compile';
import * as vite from 'global/vite';

export default {
    data() {
        return {
            compileResult: undefined,
            isReady: false
        };
    },

    async created() {
        try {
            let compileResult = await getCompileResult();
            this.compileResult = compileResult;
            this.$store.commit('setCompileResult', { compileResult });
            this.$store.commit('init', { compileResult });
            vite.setupNode(null, () => {
                vite.init().then(() => {
                    this.subscribeSnapshotBlocks();
                    this.isReady = true;
                });
            });
        } catch (err) {
            console.log(err);
        }
    },

    computed: {
        ...mapGetters(['currentNode'])
    },

    watch: {
        currentNode() {
            this.subscribeSnapshotBlocks();
        }
    },
    
    methods: {
        async subscribeSnapshotBlocks() {
            let client = vite.getVite();
            let listener;

            try {
                listener = await client.subscribe('newSnapshotBlocks');
            } catch (err) {
                console.log(err);
                return;
            }

            listener.on(async resultList => {
                let lastSnapshotBlock = resultList[resultList.length - 1];
                this.$store.commit('updateSnapshotHeight', {
                    snapshotHeight: lastSnapshotBlock.height
                });
            });
        }
    }
};
</script>

<style lang="scss" scoped>
.main-layout {
    height: 100vh;
    & > div {
        height: 100%;
    }
}
.menu-wrapper {
    border-right: 1px solid rgba(0,0,0,0.05);
}
</style>