import VueRouter from 'vue-router';

import DeployOnline from 'components/DeployOnline';
import Debug from 'components/debug';


const routes = [
    { path: '/debug', component: Debug, name: 'debug' },
    { path: '/publish', component: DeployOnline, name: 'publish' }
];

export default new VueRouter({
    routes
});

