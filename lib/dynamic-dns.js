const _ = require('lodash');
const publicIp = require('public-ip');
const transIpApi = require('./transip-api');

module.exports = {
    updateDynamicDns
};

async function updateDynamicDns({ username, privateKey, domainName, dnsName }) {
    const currentPublicIp = await publicIp.v4();
    await transIpApi.createToken(username, privateKey);
    const dnsEntriesResult = await transIpApi.dns.listAll(domainName);
    const dnsEntry = _.find(dnsEntriesResult.dnsEntries, { name: dnsName });
    return transIpApi.dns.updateSingle({
        domainName,
        name: dnsEntry.name,
        expire: dnsEntry.expire,
        type: dnsEntry.type,
        content: currentPublicIp
    });
}
