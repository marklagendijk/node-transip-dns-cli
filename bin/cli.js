#! /usr/bin/env node
const fs = require('fs');
const _ = require('lodash');
const publicIp = require('public-ip');
const parseDuration = require('parse-duration');
const api = require("../lib/api");
const { printTable } = require('../lib/table');

const argv = require('yargs')
    .scriptName('')
    .usage('Usage: transip-dns-cli <command>')
    .options({
        username: {
            alias: 'u',
            describe: 'Your TransIp username.',
            demandOption: true,
            type: 'string'
        },
        privateKey: {
            alias: 'k',
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
            describe: 'The content the DNS entries should be updated to. Uses public ip address of current machine by default.',
            type: 'string'
        },
        dryRun: {
            describe: 'Run with outputting which changes would be done, but without doing them.',
            type: 'boolean'
        }
    })
    .command('ddns-service', 'Keeps updating the content of one or more DNS entries of one or more domains to the public ip address of the current machine.', {
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
        interval: {
            alias: 'i',
            describe: 'The interval at which the service runs.',
            default: '1h',
            type: 'string'
        }
    })
    .example(
        'list-dns --username="myusername" --privateKey="$(<private-key.pem)" --domainName="my-domain.nl"',
        'List all DNS entries for the domain my-domain.nl.'
    )
    .example(
        'list-dns --username="myusername" --privateKey="$(<private-key.pem)" --domainName="my-domain.nl" --domainName="my-domain2.nl"',
        'List all DNS entries for the domains my-domain.nl and my-domain2.nl.'
    )
    .example(
        'update-dns --username="myusername" --privateKey="$(<private-key.pem)" --domainName="my-domain.nl" --dnsName="@"',
        'Update the content of the "@" DNS entry of "my-domain.nl" to the public ip of the current machine.'
    )
    .example(
        'update-dns --username="myusername" --privateKey="$(<private-key.pem)" --domainName="my-domain.nl" --dnsName="@" --content="123.123.123.123"',
        'Update the content of the "@" DNS entry of "my-domain.nl" to "123.123.123.123".'
    )
    .example(
        'ddns-service --username="myusername" --privateKey="$(<private-key.pem)" --domainName="my-domain.nl" --dnsName="@"',
        'Keep updating the content of the "@" DNS entry of "my-domain.nl" to the public ip of the current machine.'
    )
    .demandCommand()
    .env('TRANSIP')
    .wrap(null)
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
            await updateCommand(argv.username, privateKey, argv.domainName, argv.dnsName, argv.content, argv.dryRun);
            break;

        case 'ddns-service':
            const intervalInMs = parseDuration(argv.interval);
            ddnsServiceCommand(argv.username, privateKey, argv.domainName, argv.dnsName, intervalInMs)
        }
    }
    catch (e) {
        console.error(e);
    }
})();

async function listCommand(username, privateKey, domainNames) {
    await api.createToken(username, privateKey);

    const dnsEntries = await getAllDsnEntries(domainNames);

    printTable(dnsEntries, ['domainName', 'name', 'type', 'expire', 'content']);
}

async function updateCommand(username, privateKey, domainNames, dnsNames, content, dryRun) {
    content = content || await publicIp.v4();

    await api.createToken(username, privateKey);

    const dnsEntries = await getAllDsnEntries(domainNames);
    const selectedDnsEntries = dnsEntries.filter(entry => _.includes(dnsNames, entry.name));
    const updatedDnsEntries = selectedDnsEntries
        .filter(entry => entry.content !== content)
        .map(entry => ({ ...entry, oldContent: entry.content, content }));

    if (dryRun) {
        logUpdateInfo(dnsEntries, selectedDnsEntries, updatedDnsEntries, content);
    }
    else {
       await applyUpdates(updatedDnsEntries, content);
    }
}

function ddnsServiceCommand(username, privateKey, domainNames, dnsNames, intervalInMs){
    const execute = async() => {
        try {
            await updateCommand(username, privateKey, domainNames, dnsNames);
        }
        catch(e){
            console.error(e);
        }
    };
    execute();
    setInterval(execute, intervalInMs);
}

function logUpdateInfo(dnsEntries, selectedDnsEntries, updatedDnsEntries, content){
    console.log('All entries:');
    printTable(dnsEntries);

    if (selectedDnsEntries.length) {
        console.log('Selected entries:');
        printTable(selectedDnsEntries);

    } else {
        console.log('There are no selected entries. Did you enter the correct dsnName?');
    }

    console.log(`New content: ${content}`);

    if (updatedDnsEntries.length) {
        console.log('Would update the following entries:');
        printTable(updatedDnsEntries, {
            columns: ['domainName', 'name', 'type', 'expire', 'oldContent', 'content']
        });
    } else {
        console.log('There is nothing to update.');
    }
}

async function applyUpdates(updatedDnsEntries, content){
    await Promise.all(updatedDnsEntries.map(entry => api.updateSingleDns(entry)));

    if(updatedDnsEntries.length){
        console.log('Updated the following entries:');
        printTable(updatedDnsEntries);
    } else {
        console.log(`All entries did already have content: ${content}`);
    }
}

async function getAllDsnEntries(domainNames) {
    const dnsEntries = await Promise.all(domainNames.map(domainName => api.listAllDns(domainName)
        .then(result => result.dnsEntries.map(entry => ({ domainName, ...entry })))
    ));
    return _.flatten(dnsEntries);
}


