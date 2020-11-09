<template>
    <el-popover>
        <canvas ref="qrcode"></canvas>

        <el-button slot="reference" size="mini">Click to Use VC Login</el-button>
    </el-popover>
</template>

<script>
import QRCode from 'qrcode';

import { initVC, getVc } from 'services/vc';
import VcAccount from 'global/VcAccount';

export default {
    async mounted() {
        let uri = await initVC();
        this.initQR(uri);
        const vc = getVc();
        vc.on('connect', (err, payload) => {
            if (err) {
                return console.log(err);
            }
            let address = payload.params[0].accounts[0];
            this.$store.commit('setVcConnected', true);
            this.$store.dispatch('addAccount', new VcAccount({ address }));
        });
        vc.on('disconnect', () => {
            this.$store.commit('setVcConnected', false);
        });
    },
    methods: {
        initQR(uri) {
            QRCode.toCanvas(this.$refs.qrcode, uri);
        }
    }
};
</script>