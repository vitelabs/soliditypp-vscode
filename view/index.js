import 'babel-polyfill';

import './index.scss';

import Vue from 'vue';
import App from './app.vue';
import './theme/index.css';

import {
    Form,
    Button,
    FormItem,
    Input,
    Tree,
    Row,
    Col,
    Loading,
    Message,
    Select,
    Option,
    Tabs,
    TabPane
} from 'element-ui';

Vue.use(Form);
Vue.use(FormItem);
Vue.use(Button);
Vue.use(Input);
Vue.use(Tree);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(Row);
Vue.use(Col);
Vue.use(Loading.directive);
Vue.use(Select);
Vue.use(Option);

Vue.prototype.$message = Message;
Vue.prototype.$loading = Loading.service;

new Vue({
    el: '#app',
    components: { App },
    template: '<App/>'
});
