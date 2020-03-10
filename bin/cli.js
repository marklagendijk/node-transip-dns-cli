#! /usr/bin/env node
const fs = require('fs');
const _ = require('lodash');
const publicIp = require('public-ip');
const parseDuration = require('parse-duration');
const api = require("../lib/api");
const { printTable } = require('../lib/table');
const entryTableOptions = {
    columns: ['domainName', 'name', 'type', 'expire', 'content']
};
const entryUpdateTableOptions = {
    columns: ['domainName', 'name', 'type', 'expire', 'oldContent', 'content']
};

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
        name: {
            alias: 'n',
            describe: 'The name(s) of the DNS entries.',
            type: 'array'
        },
        type: {
            alias: 't',
            describe: 'The type(s) of the DNS entries.',
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
        name: {
            alias: 'n',
            describe: 'The name(s) of the DNS entries.',
            type: 'array'
        },
        type: {
            alias: 't',
            describe: 'The type(s) of the DNS entries.',
            type: 'array'
        },
        interval: {
            alias: 'i',
            describe: 'The interval at which the service runs.',
            default: '5m',
            type: 'string'
        }
    })
    .example(
        'list-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl"',
        'List all DNS entries for the domain example.nl.'
    )
    .example(
        'list-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --domainName="example2.nl"',
        'List all DNS entries for the domains example.nl and example2.nl.'
    )
    .example(
        'update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A"',
        'Update the content of all DNS entries with type "A" of "example.nl" to the public IPv4 address of the current machine.'
    )
    .example(
        'update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A" --type="AAAA"',
        'Update the content of all DNS entries with type "A" or type "AAAA" of "example.nl" to the public IPv4 or IPv6 address of the current machine.'
    )
    .example(
        'update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --name="@" --content="123.123.123.123"',
        'Update the content of the "@" DNS entry of "example.nl" to "123.123.123.123".'
    )
    .example(
        'ddns-service --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A"',
        'Keep updating the content of all DNS entries with type "A" of "example.nl" to the public IPv4 address of the current machine.'
    )
    .example(
        'ddns-service --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A" --type="AAAA"',
        'Keep updating the content of all DNS entries with type "A" or type "AAAA" of "example.nl" to the public IPv4 or IPv6 address of the current machine.'
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
            await updateCommand(argv.username, privateKey, argv.domainName, argv.name, argv.type, argv.content, argv.dryRun);
            break;

        case 'ddns-service':
            const intervalInMs = parseDuration(argv.interval);
            ddnsServiceCommand(argv.username, privateKey, argv.domainName, argv.name, argv.type, intervalInMs)
        }
    }
    catch (e) {
        console.error(e);
    }
})();

async function listCommand(username, privateKey, domainNames) {
    await api.createToken(username, privateKey);

    const dnsEntries = await getAllDsnEntries(domainNames);

    printTable(dnsEntries, entryTableOptions);
}

async function updateCommand(username, privateKey, domainNames, names, types, content, dryRun) {
    await api.createToken(username, privateKey);

    const dnsEntries = await getAllDsnEntries(domainNames);
    const selectedDnsEntries = filterDnsEntries(dnsEntries, names, types);
    const dnsEntryUpdates = await createDnsEntryUpdates(selectedDnsEntries, content);

    if (dryRun) {
        logUpdateInfo(dnsEntries, selectedDnsEntries, dnsEntryUpdates);
    }
    else {
        await applyUpdates(dnsEntryUpdates, content);
    }
}

function ddnsServiceCommand(username, privateKey, domainNames, names, types, intervalInMs) {
    let currentIpAddress = null;
    const execute = async () => {
        try {
            const newIpAddress = await publicIp.v4();
            if (currentIpAddress !== newIpAddress) {
                await updateCommand(username, privateKey, domainNames, names, types);
                currentIpAddress = newIpAddress;
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    execute();
    setInterval(execute, intervalInMs);
}

function logUpdateInfo(dnsEntries, selectedDnsEntries, dnsEntryUpdates) {
    console.log('All entries:');
    printTable(dnsEntries, entryTableOptions);

    if (selectedDnsEntries.length) {
        console.log('Selected entries:');
        printTable(selectedDnsEntries, entryTableOptions);

    }
    else {
        console.log('There are no selected entries. Did you specify the correct name(s) and / or type(s)?');
    }

    if (dnsEntryUpdates.length) {
        console.log('Would update the following entries:');
        printTable(dnsEntryUpdates, entryUpdateTableOptions);
    }
    else {
        console.log('All entries were already up to date.');
    }
}

async function getAllDsnEntries(domainNames) {
    const dnsEntries = await Promise.all(domainNames.map(domainName => api.listAllDns(domainName)
        .then(result => result.dnsEntries.map(entry => ({ domainName, ...entry })))
    ));
    return _.flatten(dnsEntries);
}

function filterDnsEntries(dnsEntries, names, types) {
    return dnsEntries.filter(entry =>
        (_.isEmpty(names) || _.includes(names, entry.name)) &&
        (_.isEmpty(types) || _.includes(types, entry.type))
    );
}

async function createDnsEntryUpdates(dnsEntries, content) {
    const publicIpAddresses = content ? null : await resolvePublicIpAddresses(dnsEntries);

    return dnsEntries
        .map(entry => ({
            ...entry,
            oldContent: entry.content,
            content: getContent(entry, content, publicIpAddresses)
        }))
        .filter(entry => entry.content !== entry.oldContent)
}

function getContent(entry, content, publicIpAddresses) {
    if (content) {
        return content;
    }
    else if (entry.type === 'A') {
        return publicIpAddresses.v4;
    }
    else if (entry.type === 'AAAA') {
        return publicIpAddresses.v6;
    }
    else {
        throw Error(`Cannot update entry "${entry.name}" of type "${entry.type}". Parameter content was not specified.`)
    }
}

async function resolvePublicIpAddresses(dnsEntries) {
    const resolvedPublicIps = {};
    if (_.some(dnsEntries, entry => entry.type === 'A')) {
        resolvedPublicIps.v4 = await publicIp.v4();
    }
    if (_.some(dnsEntries, entry => entry.type === 'AAAA')) {
        resolvedPublicIps.v6 = await publicIp.v6();
    }
    return resolvedPublicIps
}

async function applyUpdates(dnsEntryUpdates) {
    await Promise.all(dnsEntryUpdates.map(update => api.updateSingleDns(update)));

    if (dnsEntryUpdates.length) {
        console.log('Updated the following entries:');
        printTable(dnsEntryUpdates, entryUpdateTableOptions);
    }
    else {
        console.log('All entries were already up to date.');
    }
}


