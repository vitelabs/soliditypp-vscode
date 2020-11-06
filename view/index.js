import 'babel-polyfill';

import './index.scss';

import Vue from 'vue';
import VueRouter from 'vue-router';
import VueSplit from 'vue-split-panel';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import store from 'store/store';
import App from './app.vue';
import router from './router';


import Help from 'components/help';

Vue.use(VueRouter);
Vue.use(ElementUI);

Vue.use(VueSplit);

Vue.component('help', Help);

new Vue({
    el: '#app',
    store: store,
    components: { App },
    template: '<App/>',
    router
});
