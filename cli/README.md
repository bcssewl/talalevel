# talalevel

Tala Level from the command line. It runs the same tools an AI app connected to Tala Level runs, with a workspace's
API key; the key's permissions decide what it may read, change and send.

```sh
npx talalevel login          # paste the key from Settings → API and webhooks
npx talalevel tools          # what this key may do
npx talalevel help get_lead  # one command's options
npx talalevel search_leads --query "acme"
npx talalevel add_note --lead_id 123 --text "Owner back Monday"
npx talalevel send_text --lead_id 123 --text "Hi Sam, Dan here." --yes
```

- Output is short text; `--json` gives the fields.
- A command that reaches a merchant, or starts a batch, a wave or the AI caller, asks first. `--yes` answers for you;
  an agent passes it only once the person has said yes. Batches, waves and runs are previewed first, and the start
  takes the preview's id.
- `TALALEVEL_KEY` overrides the saved key; `TALALEVEL_URL` points at another address of the app.
