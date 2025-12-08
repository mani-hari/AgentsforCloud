# Cloud SQL Easy Connect - Gemini CLI Extension

Helps you connect your Cloud SQL database to GCE VMs, local laptops, and other compute sources.

## Installation (Choose One)

### Option A: Install from GitHub (Recommended)
```bash
gemini extensions install https://github.com/manigoogle/AgentsforCloud
```

### Option B: Install from Local Folder
```bash
# Clone the repo first
git clone https://github.com/manigoogle/AgentsforCloud.git

# Install the extension
gemini extensions install ./AgentsforCloud
```

## Usage

After installation, just ask:

```
gemini "Help me connect my GCE VM to Cloud SQL"
```

Or:

```
gemini "I need to connect my local laptop to Cloud SQL for development"
```

## What It Does

1. Lists your Cloud SQL instances
2. Lists your GCE VMs (if applicable)
3. Checks network compatibility
4. Guides you through the connection
5. Generates code for your programming language

## Verify Installation

```bash
gemini extensions list
```

You should see `cloudsql-easy-connect` in the list.

## Uninstall

```bash
gemini extensions uninstall cloudsql-easy-connect
```
