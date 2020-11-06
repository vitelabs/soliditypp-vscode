import Connector from '@vite/connector';

const BRIDGE = 'wss://biforst.vite.net';

const vbInstance = new Connector({ bridge: BRIDGE });

export const initVC = async () => {
    await vbInstance.createSession();
    return vbInstance.uri;
};

export const vc = vbInstance;