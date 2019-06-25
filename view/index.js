import 'babel-polyfill';

import './index.scss';

import Vue from 'vue';
import store from 'store/store';
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
    TabPane,
    Collapse,
    CollapseItem,
    Tag
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
Vue.use(Collapse);
Vue.use(CollapseItem);
Vue.use(Tag);

Vue.prototype.$message = Message;
Vue.prototype.$loading = Loading.service;

new Vue({
    el: '#app',
    store: store,
    components: { App },
    template: '<App/>'
});
