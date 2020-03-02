const crypto = require('crypto');
const uuid = require('uuid').v4;
const api = require('got').extend({
    prefixUrl: 'https://api.transip.nl/v6/',
    responseType: 'json'
});

const headers = {};

module.exports = {
    dns: {
        listAll: listAllDns,
        updateSingle: updateSingleDns
    },
    createToken,
};

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
        nonce: uuid().replace(/-/g, '')
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
