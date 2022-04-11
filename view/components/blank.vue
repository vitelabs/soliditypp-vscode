<template>
    <section>
        <h1>{{name}}<span class="page-title"> - {{this.pageTitle}}</span></h1>
        <div v-if="$route.name=='abi'">
            <el-button class="copy-button"
                :data-clipboard-text="JSON.stringify(abi)"
                >Copy</el-button>
            <vue-json-pretty
                :show-length="true"
                :data="abi"
            ></vue-json-pretty>
        </div>
        <div v-if="$route.name=='asm'">
            <el-button class="copy-button"
                :data-clipboard-text="asm"
                >Copy</el-button>
            <code>
                {{asm}}
            </code>
        </div>
        <div v-if="$route.name=='binary'">
            <el-button class="copy-button"
                :data-clipboard-text="bytecodes"
                >Copy</el-button>
            <code>
                {{bytecodes}}
            </code>
        </div>
        <div v-if="$route.name=='offchain'">
            <el-button class="copy-button"
                :data-clipboard-text="offchain"
                >Copy</el-button>
            <code>
                {{offchain}}
            </code>
        </div>
    </section>
</template>

<script>
import { mapState } from 'vuex';
import ClipboardJS from 'clipboard';
import VueJsonPretty from 'vue-json-pretty';

export default {
    components: {
        VueJsonPretty
    },
    data() {
        return {
            pageTitle: '',
        }
    },
    mounted() {
        new ClipboardJS('.copy-button');

        switch (this.$route.name) {
            case 'abi':
                this.pageTitle = 'abi'
                break;
            case 'asm':
                this.pageTitle = 'assembly'
                break;
            case 'binary':
                this.pageTitle = 'binary'
                break;
            case 'offchain':
                this.pageTitle = 'offchain code'
                break;
            default:
        }
        document.title = `${this.pageTitle.toUpperCase()} - ${document.title}`;
    },
    computed: {
        idx() {
            return this.$route.params.idx;
        },
        ...mapState({
            name (state) {
                return state.compileResult.contractNameList[this.idx];
            },
            abi (state) {
                return state.compileResult.abiList[this.idx];
            },
            asm (state) {
                return state.compileResult.asmList[this.idx];
            },
            bytecodes (state) {
                return state.compileResult.bytecodesList[this.idx];
            },
            offchain: {}
        }),
    }
};

</script>

<style lang="scss" scoped>
.page-title {
    font-weight: normal;
}
.copy-button {
    margin-bottom: 20px;
}
code {
    width: 100%;
    word-break:break-word;
    white-space: pre-wrap;
}
</style>
