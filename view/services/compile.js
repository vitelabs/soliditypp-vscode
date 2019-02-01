import Task from 'utils/task';
import request from 'utils/request';


//  import Task from 'utils/task';
let compileResultPromise = new Promise(function (resolve) {
    let task = new Task(async function () {
        try {
            let res = await request('compileResult');
            if (res && 
                res.abiList && 
                res.abiList.length > 0) {
                resolve(res);
                return false;
            }
        } catch (err) {
            console.error(err);
        }
        return true;
    }, 500);
    task.start();
});

export default function getCompileResult () {
    return compileResultPromise;
}

