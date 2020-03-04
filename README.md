# node-transip-dns-cli [![GitHub license](https://img.shields.io/github/license/marklagendijk/node-transip-dns-cli)](https://github.com/marklagendijk/node-transip-dns-cli/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/transip-dns-cli)](https://www.npmjs.com/package/transip-dns-cli) [![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/marklagendijk/transip-dns-cli)](https://hub.docker.com/r/marklagendijk/transip-dns-cli/builds) [![Docker Pulls](https://img.shields.io/docker/pulls/marklagendijk/transip-dns-cli)](https://hub.docker.com/r/marklagendijk/transip-dns-cli)
Node.js cli tool for updating TransIP DNS entries. Supports:
- Listing all DNS entries for one or more domains.
- Updating the content of one or more DNS entries of one or more domains.
- Running a service which updates content of one or more DNS entries of one or more domains to the public ip address of the current machine.

## Installation
- `npm i -g transip-dns-cli`

## CLI Documentation
### Environment variables
All args can also be specified as environment variables, with the `TRANSIP_` prefix:
```bash 
TRANSIP_USERNAME=myusername
TRANSIP_PRIVATE_KEY=-----BEGIN PRIVATE KEY----- etc
TRANSIP_PRIVATE_KEY_FILE=private-key.pem
TRANSIP_DOMAIN_NAME=my-domain.nl
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
  --interval, -i        The interval at which the service runs.  [string] [default: "1h"]
```

