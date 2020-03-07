# node-transip-dns-cli [![GitHub license](https://img.shields.io/github/license/marklagendijk/node-transip-dns-cli)](https://github.com/marklagendijk/node-transip-dns-cli/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/transip-dns-cli)](https://www.npmjs.com/package/transip-dns-cli) [![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/marklagendijk/transip-dns-cli)](https://hub.docker.com/r/marklagendijk/transip-dns-cli/builds) [![Docker Pulls](https://img.shields.io/docker/pulls/marklagendijk/transip-dns-cli)](https://hub.docker.com/r/marklagendijk/transip-dns-cli)
Node.js cli tool for updating TransIP DNS entries. Supports:
- Listing all DNS entries for one or more domains.
- Updating the content of one or more DNS entries of one or more domains.
- Running a service which updates content of one or more DNS entries of one or more domains to the public ip address of the current machine.

## Table of Contents
- [Installation](#installation)
- [Creating your private key](#creating-your-private-key)
- [CLI Documenation](#cli-documentation)
  - [Environment variables](#environment-variables)
  - [Commands](#commands)
    - [list-dns](#list-dns)
    - [update-dns](#update-dns)
    - [ddns-service](#ddns-service)
- [Docker](#docker)
  - [Docker Run](#docker-run)
  - [Docker Compose](#docker-compose)

## Installation
- `npm i -g transip-dns-cli`

# Creating your private key
1. Go to https://www.transip.nl/cp/account/api/
2. Create a new Key Pair. Note: the 'Whitelisted IP' must not be checked if want to do use `ddns-service`. 

## CLI Documentation
### Environment variables
All args can also be specified as environment variables, with the `TRANSIP_` prefix:
```bash 
TRANSIP_USERNAME=myusername
TRANSIP_PRIVATE_KEY=$(<private-key.pem)
TRANSIP_PRIVATE_KEY_FILE=private-key.pem
TRANSIP_DOMAIN_NAME=example.nl
TRANSIP_DNS_NAME=@
TRANSIP_CONTENT=127.0.0.1
TRANSIP_DRY_RUN=true
```

### Commands
```
Usage: transip-dns-cli <command>

Commands:
   list-dns     List all DNS entries for one or more domains.
   update-dns   Updates the content of one or more DNS entries of one or more domains.
   ddns-service  Keeps updating the content of one or more DNS entries of one or more domains to the public ip address of the current machine..

Options:
  --help                Show help  [boolean]
  --version             Show version number  [boolean]
  --username, -u        Your TransIp username.  [string] [required]
  --privateKey, -k      Your TransIp privateKey.  [string]
  --privateKeyFile, -f  Path to the file containing your TransIp privateKey.  [string]

Examples:
  list-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl"                                              List all DNS entries for the domain example.nl.
  list-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --domainName="example2.nl"                   List all DNS entries for the domains example.nl and example2.nl.
  update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --dnsName="@"                              Update the content of the "@" DNS entry of "example.nl" to the public ip of the current machine.
  update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --dnsName="@" --content="123.123.123.123"  Update the content of the "@" DNS entry of "example.nl" to "123.123.123.123".
  ddns-service --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --dnsName="@"                            Keep updating the content of the "@" DNS entry of "example.nl" to the public ip of the current machine.
```

#### list-dns
```
transip-dns-cli list-dns

List all DNS entries for one or more domains.

Options:
  --help                Show help  [boolean]
  --version             Show version number  [boolean]
  --username, -u        Your TransIp username.  [string] [required]
  --privateKey, -k      Your TransIp privateKey.  [string]
  --privateKeyFile, -f  Path to the file containing your TransIp privateKey.  [string]
  --domainName, -d      The domain name(s) of which the DNS entries should be listed.  [array] [required]
```
Example:
```
transip-dns-cli list-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl"
╔══════════════╤══════╤════════╤═══════╤═════════════════╗
║ domainName   │ name │ expire │ type  │ content         ║
╟──────────────┼──────┼────────┼───────┼─────────────────╢
║ example.nl   │ *    │ 3600   │ CNAME │ @               ║
╟──────────────┼──────┼────────┼───────┼─────────────────╢
║ example.nl   │ @    │ 3600   │ A     │ 123.123.123.123 ║
╚══════════════╧══════╧════════╧═══════╧═════════════════╝
```
#### update-dns
```
transip-dns-cli update-dns

Updates the content of one or more DNS entries of one or more domains.

Options:
  --help                Show help  [boolean]
  --version             Show version number  [boolean]
  --username, -u        Your TransIp username.  [string] [required]
  --privateKey, -k      Your TransIp privateKey.  [string]
  --privateKeyFile, -f  Path to the file containing your TransIp privateKey.  [string]
  --domainName, -d      The domain name(s) of the DNS entries.  [array] [required]
  --dnsName, -n         The name(s) of the DNS entries.  [array] [required]
  --content, -c         The content the DNS entries should be updated to. Uses public ip address of current machine by default.  [string]
  --dryRun              Run with outputting which changes would be done, but without doing them.  [boolean]
```
Example (dryRun):
```
transip-dns-cli update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --dnsName="@" --content="123.123.123.123" --dryRun
All entries:
╔══════════════╤══════╤════════╤═══════╤═════════════════╗
║ domainName   │ name │ expire │ type  │ content         ║
╟──────────────┼──────┼────────┼───────┼─────────────────╢
║ example.nl   │ *    │ 3600   │ CNAME │ @               ║
╟──────────────┼──────┼────────┼───────┼─────────────────╢
║ example.nl   │ @    │ 3600   │ A     │ 124.124.124.124 ║
╚══════════════╧══════╧════════╧═══════╧═════════════════╝

Selected entries:
╔══════════════╤══════╤════════╤═══════╤═════════════════╗
║ domainName   │ name │ expire │ type  │ content         ║
╟──────────────┼──────┼────────┼───────┼─────────────────╢
║ example.nl   │ @    │ 3600   │ A     │ 124.124.124.124 ║
╚══════════════╧══════╧════════╧═══════╧═════════════════╝

New content: 123.123.123.123
Would update the following entries:
╔══════════════╤══════╤══════╤════════╤═════════════════╤═════════════════╗
║ domainName   │ name │ type │ expire │ oldContent      │ content         ║
╟──────────────┼──────┼──────┼────────┼─────────────────┼─────────────────╢
║ example.nl   │ @    │ A    │ 3600   │ 124.124.124.124 │ 123.123.123.123 ║
╚══════════════╧══════╧══════╧════════╧═════════════════╧═════════════════╝
```
Example:
```
transip-dns-cli update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --dnsName="@" --content="123.123.123.123"
Updated the following entries:
╔══════════════╤══════╤══════╤════════╤═════════════════╤═════════════════╗
║ domainName   │ name │ type │ expire │ oldContent      │ content         ║
╟──────────────┼──────┼──────┼────────┼─────────────────┼─────────────────╢
║ example.nl   │ @    │ A    │ 3600   │ 124.124.124.124 │ 123.123.123.123 ║
╚══════════════╧══════╧══════╧════════╧═════════════════╧═════════════════╝
```

#### ddns-service
```
transip-dns-cli ddns-service

Keeps updating the content of one or more DNS entries of one or more domains to the public ip address of the current machine..

Options:
  --help                Show help  [boolean]
  --version             Show version number  [boolean]
  --username, -u        Your TransIp username.  [string] [required]
  --privateKey, -k      Your TransIp privateKey.  [string]
  --privateKeyFile, -f  Path to the file containing your TransIp privateKey.  [string]
  --domainName, -d      The domain name(s) of the DNS entries.  [array] [required]
  --dnsName, -n         The name(s) of the DNS entries.  [array] [required]
  --interval, -i        The interval at which the service runs.  [string] [default: "5m"]
```
Example:
```
transip-dns-cli ddns-service --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --dnsName="@"
Updated the following entries:
╔══════════════╤══════╤══════╤════════╤═════════════════╤═════════════════╗
║ domainName   │ name │ type │ expire │ oldContent      │ content         ║
╟──────────────┼──────┼──────┼────────┼─────────────────┼─────────────────╢
║ example.nl   │ @    │ A    │ 3600   │ 124.124.124.124 │ 123.123.123.123 ║
╚══════════════╧══════╧══════╧════════╧═════════════════╧═════════════════╝
```

## Docker
### Docker Run
```
sudo docker run \
 --name transip-dns-cli \
 --rm \
  marklagendijk/transip-dns-cli list-dns \
 --username="myusername" \
 --privateKey="$(<private-key.pem)" \
 --domainName="example.nl"
```

### Docker Compose
`docker-compose.yaml`:
``` yaml
version: "3"
services:
  transip-dns-cli:
    image: marklagendijk/transip-dns-cli
    restart: unless-stopped
    environment:
      - TRANSIP_USERNAME=myusername
      - |
        TRANSIP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
        -----END PRIVATE KEY-----
    command: ddns-service --domainName="example.nl" --dnsName="@"
```
