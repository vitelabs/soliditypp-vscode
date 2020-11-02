<template>
    <div>
        <deploy-list v-if="compileResult"></deploy-list>
    </div>
</template>

<script>
import deployList from 'components/deployList';
import { mapState } from 'vuex';

export default {
    components: {
        deployList
    },
    computed: {
        ...mapState(['compileResult'])
    },
}
</script>

<<style lang="scss" scope>
    
</style>