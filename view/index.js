import 'babel-polyfill';

import './index.scss';
import Vue from 'vue';
import App from './app.vue';
import {
    Form,
    Button,
    FormItem,
    Input,
    Tree
} from 'element-ui';

Vue.use(Form);
Vue.use(FormItem);
Vue.use(Button);
Vue.use(Input);
Vue.use(Tree);

new Vue({
    el: '#app',
    components: { App },
    template: '<App/>'
});