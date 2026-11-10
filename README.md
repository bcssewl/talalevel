# TalaLevel for AI agents and the command line

Let Claude, ChatGPT, Cursor or a shell script work your sales follow-up: find a lead, read every call, text and
email with them, prep the next call, plan the day, add notes and tasks, and send texts and emails once you say yes.

[TalaLevel](https://talalevel.com) is a dialer, texting and email app for people who sell by phone. This repo is
the open part: the MCP connector's plugin for Claude Code and the `talalevel` command line. You need a TalaLevel
account to use either.

## What you can ask

```
Who do I need to call back today, and what did we last say to each?
Prep me for my 3pm with Rivera Plumbing.
Find everyone who replied to a text this week and has no task. Add one for tomorrow.
Draft a follow-up to the leads I spoke to on Friday. Show me before anything goes.
```

## Connect an AI app (MCP)

Add a custom connector with this address, then sign in with your TalaLevel login:

```
https://app.talalevel.com/mcp
```

When you sign in you choose what the app may do: read, change, or send. You can change that or cut it off any time
in TalaLevel under Settings → AI apps.

## Claude Code plugin

```sh
claude plugin marketplace add bcssewl/talalevel
claude plugin install talalevel@talalevel
```

It adds the connector and a skill that teaches Claude how to work a sales floor. The first time a tool is used,
Claude Code asks you to sign in.

## Command line

```sh
npx talalevel login          # paste a key from Settings → API and webhooks
npx talalevel tools          # what this key may do
npx talalevel get_lead --lead_id 123
```

The same tools by the same names, for scripts and loops. See [`cli/README.md`](cli/README.md).

## What the agent can and cannot do

- **Read:** `search_leads`, `get_lead`, `get_lead_timeline`, `get_texts`, `get_call`, `list_lead_emails`,
  `list_tasks`, `list_events`, and ready-made commands such as `prep_for_call`, `my_day` and `follow_ups`.
- **Change:** notes, statuses, tasks and lists, made as you and named in the app's activity log.
- **Send:** `send_text`, `send_email`, text batches and AI caller runs. Each one is previewed and waits for your
  yes. Without send permission the agent can only leave a draft in your own text box for you to send.
- **Refusals stay refusals.** A STOP, quiet hours where the lead is, a landline or the day's limit blocks a send,
  and the agent is told to report the reason and not work around it.
- **A lead's words are data.** Texts, emails and call transcripts are fenced off so that nothing a lead writes is
  read as an instruction to the agent.

## Licence

MIT. See [`LICENSE`](LICENSE).
