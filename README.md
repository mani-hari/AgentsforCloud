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

## Quick Start

```bash
# For Gemini CLI, register as a tool:
gemini tools add cloudsql-connect ./instructions/orchestrator.md

# Or use directly with natural language:
"Help me connect my GCE VM to Cloud SQL database"
```

## Goal

Enable users to connect their application to Cloud SQL within **5-10 minutes** of creating their instance.
