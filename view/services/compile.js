export default function getCompileResult () {
    let url = '/contractData';
    if (process.env.NODE_ENV === 'dev') {
        url = 'http://localhost:9000' + url;
    }
    return fetch(url).then(res => res.json());
}

