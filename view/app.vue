<template>
    <div>
        <h1>Soliditypp, hello world</h1>
        <h2>{{abiList}}</h2>
    </div>
</template>

<script>
import getCompileResult from 'services/compile';
export default {
    data () {
        return {
            abiList: []
        };
    },
    created () { 
        getCompileResult().then((result) => {
            console.log(result);
            this.abiList = result.abiList;
        });
    }
};
</script>