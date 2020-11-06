<template>
    <div>
        <div>
            Please scan code to login ...
        </div>
        <canvas ref="qrcode"></canvas>
    </div>
</template>

<script>
import QRCode from 'qrcode';
import { initVC, vc } from 'services/vc';

export default {
    async mounted() {
        let uri = await initVC();
        this.initQR(uri);
        vc.on('connect', (err, payload) => {
            if (err) {
                return console.log(err);
            }
            let address = payload.params[0].accounts[0];
            this.$store.commit('setLoginAddress', { address });
        });
        vc.on('disconnect', () => {
            this.$store.commit('setLoginAddress', { address: null });
        });
    },
    methods: {
        initQR(uri) {
            QRCode.toCanvas(this.$refs.qrcode, uri);
        }
    }
};
</script>