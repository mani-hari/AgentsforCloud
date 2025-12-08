# Cloud SQL Easy Connect - Agent Tool

A natural language tool for Gemini CLI and other AI agents to help users connect their Cloud SQL databases to various compute sources.

## Overview

This tool guides users through a structured workflow to establish connectivity between Cloud SQL instances and application compute resources (GCE VMs, local laptops, GKE, Cloud Run, App Engine, etc.).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloud SQL Easy Connect                        │
├─────────────────────────────────────────────────────────────────┤
│  Step 1: Select Compute Source Type                             │
│  ├── GCE VM                                                     │
│  ├── Local Laptop (Development)                                 │
│  ├── GKE Container                                              │
│  ├── Cloud Run                                                  │
│  └── App Engine                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Step 2: Select Specific Instance & Network Validation          │
│  ├── Fetch instances from current project                       │
│  ├── Validate network compatibility                             │
│  ├── Check IP configuration (Private/Public)                    │
│  └── Provide remediation if incompatible                        │
├─────────────────────────────────────────────────────────────────┤
│  Step 3: Connection Test                                        │
│  ├── SSH into compute resource (if applicable)                  │
│  ├── Install database client                                    │
│  └── Test connectivity to Cloud SQL                             │
├─────────────────────────────────────────────────────────────────┤
│  Step 4: Generate Connection Code                               │
│  ├── Ask programming language                                   │
│  ├── Generate connection string                                 │
│  └── Provide connector library code                             │
└─────────────────────────────────────────────────────────────────┘
```

## Instruction Files

| File | Description |
|------|-------------|
| [gce-vm-private-ip.md](./instructions/gce-vm-private-ip.md) | Connect GCE VM via Private IP |
| [gce-vm-public-ip.md](./instructions/gce-vm-public-ip.md) | Connect GCE VM via Public IP |
| [local-laptop.md](./instructions/local-laptop.md) | Connect from Local Development Machine |
| [common-utilities.md](./instructions/common-utilities.md) | Shared utilities and helpers |
| [orchestrator.md](./instructions/orchestrator.md) | Main tool orchestration logic |

## Supported Databases

- Cloud SQL for PostgreSQL
- Cloud SQL for MySQL
- Cloud SQL for SQL Server

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and configured
- Appropriate IAM permissions for Cloud SQL and Compute Engine
- Active GCP project with billing enabled

## Installation

### Option 1: Gemini CLI Extension (Recommended)

```bash
# Install from local directory
gemini extensions install /path/to/AgentsforCloud

# Or link for development (auto-updates on changes)
gemini extensions link /path/to/AgentsforCloud

# Or install from GitHub
gemini extensions install https://github.com/YOUR_ORG/AgentsforCloud
```

After installation, just ask Gemini CLI:
```
"Help me connect my GCE VM to Cloud SQL database"
```

### Option 2: Tools API (settings.json)

Add to `~/.gemini/settings.json`:

```json
{
  "tools": {
    "discoveryCommand": "cat /path/to/AgentsforCloud/tools-discovery.json",
    "callCommand": "bash /path/to/AgentsforCloud/tools-executor.sh"
  }
}
```

### Option 3: Claude Code / Other AI Agents

Simply reference the instruction files in your prompt:
```
Read the instructions from ./instructions/orchestrator.md and help me connect to Cloud SQL
```

### Option 4: Direct Use (Copy/Paste)

Open the relevant instruction file and follow the steps manually:
- [GCE VM + Private IP](./instructions/gce-vm-private-ip.md)
- [GCE VM + Public IP](./instructions/gce-vm-public-ip.md)
- [Local Laptop](./instructions/local-laptop.md)

## File Structure

```
AgentsforCloud/
├── README.md                    # This file
├── GEMINI.md                    # Context file for Gemini CLI
├── gemini-extension.json        # Extension manifest
└── instructions/
    ├── orchestrator.md          # Main workflow logic
    ├── gce-vm-private-ip.md     # GCE + Private IP guide
    ├── gce-vm-public-ip.md      # GCE + Public IP guide
    ├── local-laptop.md          # Local dev guide
    └── common-utilities.md      # Shared utilities
```

## Goal

Enable users to connect their application to Cloud SQL within **5-10 minutes** of creating their instance.
