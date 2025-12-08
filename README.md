# Cloud SQL Easy Connect - Gemini CLI Extension

An AI assistant that guides you through connecting your Cloud SQL database to GCE VMs or local development machines.

**Note:** This extension provides guidance - it tells you what commands to run, and you run them. It does not execute commands automatically.

## Installation

```bash
gemini extensions install https://github.com/manigoogle/AgentsforCloud
```

## Usage

Start Gemini CLI and ask for help:

```bash
gemini
```

Then type:
```
Help me connect my GCE VM to Cloud SQL
```

Or:
```
I need to connect my local laptop to Cloud SQL for development
```

## How It Works

1. The assistant asks about your setup (GCE VM or laptop, PostgreSQL or MySQL)
2. It tells you what `gcloud` commands to run
3. You run the commands and share the output
4. It guides you through the connection process
5. It provides code snippets for your programming language

## Verify Installation

```bash
gemini extensions list
```

Look for `cloudsql-easy-connect` in the output.

## Uninstall

```bash
gemini extensions uninstall cloudsql-easy-connect
```

## Files

- `gemini-extension.json` - Extension manifest
- `GEMINI.md` - Instructions the AI follows to help you
