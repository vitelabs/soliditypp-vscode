import VueRouter from 'vue-router';

import Setting from 'components/setting';
import Debug from 'components/debug';


const routes = [
    { path: '/debug', component: Debug, name: 'debug' },
    { path: '/setting', component: Setting, name: 'setting' }
];

export default new VueRouter({
    routes
});

