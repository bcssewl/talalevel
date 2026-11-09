# Tala Level for AI apps and the command line

Work a Tala Level sales floor from Claude, ChatGPT, Cursor or a terminal: find leads, read their calls, texts and
emails, prep for a call, plan the day, add notes and tasks, and — with your yes each time — send.

## Connect an AI app

Add a custom connector with this address, then sign in with your Tala Level login:

```
https://app.talalevel.com/mcp
```

You choose what the app may do (read, change, send) when you sign in, and can change or cut it off any time in
Tala Level under Settings → AI apps.

## Claude Code plugin

```sh
claude plugin marketplace add bcssewl/talalevel
claude plugin install talalevel@talalevel
```

It adds the connector and a skill that teaches Claude how to work the floor. The first time a tool is used, Claude
Code asks you to sign in.

## Command line

```sh
npx talalevel login          # paste a key from Settings → API and webhooks
npx talalevel tools          # what this key may do
npx talalevel get_lead --lead_id 123
```

See [`cli/README.md`](cli/README.md).
