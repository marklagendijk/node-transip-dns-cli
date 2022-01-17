# node-transip-dns-cli [![GitHub license](https://img.shields.io/github/license/marklagendijk/node-transip-dns-cli)](https://github.com/marklagendijk/node-transip-dns-cli/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/transip-dns-cli)](https://www.npmjs.com/package/transip-dns-cli) [![Docker Pulls](https://img.shields.io/docker/pulls/marklagendijk/transip-dns-cli)](https://hub.docker.com/r/marklagendijk/transip-dns-cli)

Node.js cli tool for updating [TransIP](https://www.transip.nl/) DNS entries using the TransIP REST API. Supports:

- Installing globally as cli tool
- Running as Docker container
- Listing all DNS entries for one or more domains.
- Updating the content of one or more DNS entries of one or more domains.
- Running a service which updates content of one or more DNS entries of one or more domains to the public IPv4 and / or IPv6 address of the current machine (DDNS).

## Table of Contents

- [Creating your private key](#creating-your-private-key)
- [Installation](#installation)
  - [NPM](#npm)
  - [Docker Run](#docker-run)
  - [Docker Compose](#docker-compose)
  - [Docker Compose on Raspberry Pi](#docker-compose-on-raspberry-pi)
- [CLI Documentation](#cli-documentation)
  - [Glossary](#glossary)
  - [Environment variables](#environment-variables)
  - [Commands](#commands)
    - [list-dns](#list-dns)
    - [update-dns](#update-dns)
    - [ddns-service](#ddns-service)

# Creating your private key

1. Go to https://www.transip.nl/cp/account/api/
2. Create a new Key Pair. Note: the 'Whitelisted IP' must not be checked if want to do use `ddns-service`.
3. Save the private key in a file, e.g. `private-key.pem`.

## Installation

### NPM

1. Install Node.js 12.x or higher ([Windows](https://nodejs.org/en/download/current/) | [Linux](https://github.com/nodesource/distributions#debinstall) | [OSx](https://nodejs.org/en/download/current/)).
2. `npm i -g transip-dns-cli`

### Docker Run
Note: the Docker image is a multiarch image. So it will also work on Raspberry Pi's.

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

`docker-compose.yml`:

```yaml
version: "3"
services:
  transip-dns-cli:
    image: marklagendijk/transip-dns-cli
    restart: unless-stopped
    volumes:
      - ./private-key.pem:/home/node/app/private-key.pem
    command: ddns-service --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A"
```

## CLI Documentation

### Glossary

- `domainName`: The domain you have registered at TransIP.
- `DNS entry`: Every domain has DNS configuration. This configuration consists of multiple DNS entries.
- `name`: The name of a DNS entry. E.g. `@`, `*`, `www` or `mail`.
- `type`: The type of DNS entry. Possbible types are `A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, `SRV`, `SSHFP` and `TLSA`.
- `expire`: The expiration time of a DNS entry in seconds. E.g `3600` (1 hour).
- `content`: The content of a DNS entry. IPv4 address for type `A` entries, IPv6 address for type `AAAA` entries, etc.

### Environment variables

All args can also be specified as environment variables, with the `TRANSIP_` prefix:

```bash
TRANSIP_USERNAME=myusername
TRANSIP_PRIVATE_KEY=$(<private-key.pem)
TRANSIP_PRIVATE_KEY_FILE=private-key.pem
TRANSIP_DOMAIN_NAME=example.nl
TRANSIP_NAME=@
TRANSIP_TYPE=A
TRANSIP_CONTENT=127.0.0.1
TRANSIP_DRY_RUN=true
```

### Commands

```
Usage: transip-dns-cli <command>

Commands:
   list-dns      List all DNS entries for one or more domains.
   update-dns    Updates the content of one or more DNS entries of one or more domains.
   ddns-service  Keeps updating the content of one or more DNS entries of one or more domains to the public ip address of the current machine..

Options:
  --help                Show help  [boolean]
  --version             Show version number  [boolean]
  --username, -u        Your TransIp username.  [string] [required]
  --privateKey, -k      Your TransIp privateKey.  [string]
  --privateKeyFile, -f  Path to the file containing your TransIp privateKey.  [string]

Examples:
  list-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl"                                           List all DNS entries for the domain example.nl.
  list-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --domainName="example2.nl"                List all DNS entries for the domains example.nl and example2.nl.
  update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A"                              Update the content of all DNS entries with type "A" of "example.nl" to the public IPv4 address of the current machine.
  update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A" --type="AAAA"                Update the content of all DNS entries with type "A" or type "AAAA" of "example.nl" to the public IPv4 or IPv6 address of the current machine.
  update-dns --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --name="@" --content="123.123.123.123"  Update the content of the "@" DNS entry of "example.nl" to "123.123.123.123".
  ddns-service --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A"                            Keep updating the content of all DNS entries with type "A" of "example.nl" to the public IPv4 address of the current machine.
  ddns-service --username="myusername" --privateKeyFile="private-key.pem" --domainName="example.nl" --type="A" --type="AAAA"              Keep updating the content of all DNS entries with type "A" or type "AAAA" of "example.nl" to the public IPv4 or IPv6 address of the current machine.
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
transip-dns-cli list-dns \
  --username="myusername" \
  --privateKeyFile="private-key.pem" \
  --domainName="example.nl"
```

Outputs:

```
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
  --name, -n            The name(s) of the DNS entries.  [array]
  --type, -t            The type(s) of the DNS entries.  [array]
  --content, -c         The content the DNS entries should be updated to. Uses public ip address of current machine by default.  [string]
  --dryRun              Run with outputting which changes would be done, but without doing them.  [boolean]
```

Example (dryRun):

```
transip-dns-cli update-dns \
  --username="myusername" \
  --privateKeyFile="private-key.pem" \
  --domainName="example.nl" \
  --type="A" \
  --content="123.123.123.123" \
  --dryRun
```

Outputs:

```
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

Would update the following entries:
╔══════════════╤══════╤══════╤════════╤═════════════════╤═════════════════╗
║ domainName   │ name │ type │ expire │ oldContent      │ content         ║
╟──────────────┼──────┼──────┼────────┼─────────────────┼─────────────────╢
║ example.nl   │ @    │ A    │ 3600   │ 124.124.124.124 │ 123.123.123.123 ║
╚══════════════╧══════╧══════╧════════╧═════════════════╧═════════════════╝
```

Example:

```
transip-dns-cli update-dns \
  --username="myusername" \
  --privateKeyFile="private-key.pem" \
  --domainName="example.nl" \
  --type="A" \
  --content="123.123.123.123"
```

Outputs:

```
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
  --name, -n            The name(s) of the DNS entries.  [array]
  --type, -t            The type(s) of the DNS entries.  [array]
  --interval, -i        The interval at which the service runs.  [string] [default: "5m"]
```

Example:

```
transip-dns-cli ddns-service \
  --username="myusername" \
  --privateKeyFile="private-key.pem" \
  --domainName="example.nl" \
  --type="A"
```

Outputs:

```
Updated the following entries:
╔══════════════╤══════╤══════╤════════╤═════════════════╤═════════════════╗
║ domainName   │ name │ type │ expire │ oldContent      │ content         ║
╟──────────────┼──────┼──────┼────────┼─────────────────┼─────────────────╢
║ example.nl   │ @    │ A    │ 3600   │ 124.124.124.124 │ 123.123.123.123 ║
╚══════════════╧══════╧══════╧════════╧═════════════════╧═════════════════╝
```