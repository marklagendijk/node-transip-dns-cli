const crypto = require('crypto');
const uuid = require('uuid').v4;
const got = require('got');

module.exports = {
    createToken,
    listAllDns,
    updateSingleDns
};

const api = got.extend({
    prefixUrl: 'https://api.transip.nl/v6/',
    responseType: 'json'
});

const headers = {};

async function listAllDns(domainName) {
    return api
        .get(`domains/${encodeURIComponent(domainName)}/dns`, { headers })
        .json()
}

async function updateSingleDns({ domainName, name, expire, type, content }){
    return api
        .patch(`domains/${encodeURIComponent(domainName)}/dns`, {
            headers,
            json: {
                dnsEntry: {
                    name,
                    expire,
                    type,
                    content
                }
            }
        })
        .json()
}

async function createToken(username, privateKey) {
    const body = {
        login: username,
        nonce: uuid().replace(/-/g, ''),
        global_key: true
    };
    return api
        .post('auth', {
            headers: {
                Signature: sign(JSON.stringify(body), privateKey)
            },
            json: body
        })
        .json()
        .then(setAuthorization)
}

function sign(data, privateKey) {
    const signer = crypto.createSign('sha512');
    signer.update(data, 'utf8');
    return signer.sign(privateKey, 'base64');
}

function setAuthorization({ token }) {
    headers.Authorization = `Bearer ${token}`;
    return token;
}
