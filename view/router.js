import VueRouter from 'vue-router';

import Setting from 'components/setting';
import Debug from 'components/debug';
import Blank from 'components/blank';


const routes = [
    { path: '/debug', component: Debug, name: 'debug' },
    { path: '/setting', component: Setting, name: 'setting' },
    { path: '/abi/:idx', component: Blank, name: 'abi' },
    { path: '/asm/:idx', component: Blank, name: 'asm' },
    { path: '/binary/:idx', component: Blank, name: 'binary' },
    { path: '/offchain/:idx', component: Blank, name: 'offchain' }
];

export default new VueRouter({
    routes
});

