import Connector from '@vite/connector';

const BRIDGE = 'wss://biforst.vite.net';

const vbInstance = new Connector({ bridge: BRIDGE });

export const initVC = async () => {
    await vbInstance.createSession();
    return vbInstance.uri;
};

export const getVc = () => vbInstance;

export const sendVcTx = async (...args) => {
    let vc = getVc();
    return new Promise((res, rej) => {
        vc.on('disconnect', () => {
            rej({ code: 11020, message: 'vc disconnect' });
        });

        vc.sendCustomRequest({ method: 'vite_signAndSendTx', params: args }).then(r => {
            res(r);
        }).catch(e => {
            rej(e);
        });
    });
};

