#! /usr/bin/env node
import fs from "fs";
import _ from "lodash";
import publicIp from "public-ip";
import * as api from "../lib/api";
import { printTable } from "../lib/table";

const argv = require('yargs')
    .usage('Usage: transip-dns-cli <command>')
    .options({
        username: {
            alias: 'u',
            describe: 'Your TransIp username.',
            demandOption: true,
            type: 'string'
        },
        privateKey: {
            alias: 'privateKey',
            describe: 'Your TransIp privateKey.',
            type: 'string'
        },
        privateKeyFile: {
            alias: 'f',
            describe: 'Path to the file containing your TransIp privateKey.',
            type: 'string'
        }
    })
    .check(argv => {
        if (!argv.privateKey && !argv.privateKeyFile) {
            throw(new Error('Missing required argument: privateKey or privateKeyFile.'));
        }
        return true;
    })
    .command('list-dns', 'List all DNS entries for one or more domains.', {
        domainName: {
            alias: 'd',
            describe: 'The domain name(s) of which the DNS entries should be listed.',
            demandOption: true,
            type: 'array'
        }
    })
    .command('update-dns', 'Updates the content of one or more DNS entries of one or more domains.', {
        domainName: {
            alias: 'd',
            describe: 'The domain name(s) of the DNS entries.',
            demandOption: true,
            type: 'array'
        },
        dnsName: {
            alias: 'n',
            describe: 'The name(s) of the DNS entries.',
            demandOption: true,
            type: 'array'
        },
        content: {
            alias: 'c',
            describe: 'The content the DNS entries should be updated to. Uses public ip address of current machine by default.'
        }
    })
    .demandCommand()
    .env('TRANS_IP')
    .argv;


(async () => {
    try {
        const command = argv._[0];
        const privateKey = argv.privateKey || fs.readFileSync(argv.privateKeyFile, 'utf8');

        switch (command) {
            case 'list-dns':
                await listCommand(argv.username, privateKey, argv.domainName);
                break;

            case 'update-dns':
                await updateCommand(argv.username, privateKey, arg.domainName, argv.dnsName, argv.content);
                break;
        }
    } catch (e) {
        console.error(e);
    }
})();

async function listCommand(username, privateKey, domainNames){
    await api.createToken(username, privateKey);

    const dnsEntries = await getAllDsnEntries(domainNames);

    printTable(dnsEntries, ['domainName', 'name', 'type', 'expire', 'content']);
}

async function updateCommand(username, privateKey, domainNames, dnsNames, content = await publicIp.v4()){
    await api.createToken(username, privateKey);

    const dnsEntries = await getAllDsnEntries(domainNames);
    const selectedDnsEntries = dnsEntries.filter(entry => _.includes(dnsNames, entry.name));
    const changedDnsEntries = selectedDnsEntries.filter(entry => entry.content !== content);

    await Promise.all(changedDnsEntries.map(entry => api.updateSingleDns({ ...entry, content})));

    console.log('Updated the following items:');
    printTable(changedDnsEntries, ['domainName', 'name', 'type', 'expire', 'content']);
}

async function getAllDsnEntries(domainNames) {
    const dnsEntries = await Promise.all(domainNames.map(domainName => api.listAllDns(domainName)
        .then(result => result.dnsEntries.map(entry => ({domainName, ...entry})))
    ));
    return _.flatten(dnsEntries);
}


