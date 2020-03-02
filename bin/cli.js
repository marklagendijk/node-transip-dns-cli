#! /usr/bin/env node
const fs = require('fs');
const _ = require('lodash');
const publicIp = require('public-ip');
const api = require('../lib/api');
const { printTable } = require('../lib/table');

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
    try{
        const command = argv._[0];
        const username = argv.username;
        const privateKey = argv.privateKey || fs.readFileSync(argv.privateKeyFile, 'utf8');
        const domainNames = argv.domainName;

        await api.createToken(username, privateKey);

        switch (command) {
        case 'list-dns':
            const dnsEntries = await Promise.all(domainNames.map(domainName => api.dns
                .listAll(domainName)
                .then(result => result.dnsEntries.map( entry => ({ domainName, ...entry })))
            ));
            printTable(_.flatten(dnsEntries), ['domainName', 'name', 'type', 'expire', 'content']);
            break;

        case 'update-dns':
            const dnsNames = argv.dnsName;
            const content = argv.content || await publicIp.v4();
            break;
        }
    }
    catch(e){
        console.error(e);
    }
})();


