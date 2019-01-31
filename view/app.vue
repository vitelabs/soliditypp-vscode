<template>
    <div>
        <h1>Soliditypp, hello world</h1>
        <h2>{{byteCodes}}</h2>
    </div>
</template>

<script>
import request from 'utils/request';
export default {
    data () {
        return {
            byteCodes: ['a', 'b']
        };
    },
    created () {  
        request('compileResult').then(function (res) {
            console.log(res);
        }).catch(function (err) {
            console.log(err);
        });

    }
};
</script>