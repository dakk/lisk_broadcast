# lisk_broadcast
Signer for lisk multisig transactions


## Install

```bash
git clone https://github.com/dakk/lisk_broadcast
cd lisk_broadcast
npm install
```

## Usage

```bash
npm run sign
```

or

```bash
node signer [pubkeyname]
```

You can also loop forever, waiting for transactions to sign:

```bash
node signer [pubkeyname] loop
```

or

```bash
npm run loop-gdt
```