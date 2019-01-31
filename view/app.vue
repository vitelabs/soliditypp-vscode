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
        console.log(request);
        for (let i = 0; i < 10; i++) {
            request('sayhello', {
                text: 'hello world'
            }).then(function (res) {
                console.log(res);
            }).catch(function (err) {
                console.log(err);
            });
        }
 
    }
};
</script>