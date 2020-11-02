export default function getCompileResult () {
    return fetch('/contractData').then(res => res.json());
}

