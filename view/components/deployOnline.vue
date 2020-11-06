<template>
    <div>
        <vc-login v-if="!loginAddress"></vc-login>

        
    </div>
</template>

<script>
import VcLogin from 'components/vcLogin';
// import { initVC, vc } from 'services/vc';
import { mapState } from 'vuex';


export default {
    components: {
        VcLogin
    },
    computed: {
        ...mapState(['loginAddress']),
    },
};
</script>

<style lang="scss" scope>
    
</style>