# Cloud SQL Easy Connect - Gemini CLI Extension

An AI-powered Gemini CLI extension that automates the steps to connect a Cloud SQL instance to a compute destination, starting with GCE VMs. It authenticates, lists resources, validates networking, and (with your approval) runs the necessary `gcloud` commands for you.

## Quick Start (Google Cloud Shell)
Follow these steps in Cloud Shell to register and use the extension.

1. **Verify Gemini CLI exists (install if missing):**
   ```bash
   gemini --version || gcloud components install gemini
   ```
2. **Install the extension from this repo (registers the tool):**
   ```bash
   gemini extensions install https://github.com/manigoogle/AgentsforCloud
   ```
3. **Confirm it registered correctly:**
   ```bash
   gemini extensions list | grep cloudsql-gce-connector
   ```
4. **Run Gemini CLI with the extension enabled:**
   ```bash
   gemini --extensions cloudsql-gce-connector
   ```
5. **Start the guided flow:**
   ```
   Help me connect my GCE VM to Cloud SQL
   ```

## What the Extension Does (Step-by-Step)
- **Step 1:** Authenticate and enumerate Cloud SQL instances in your active project; you pick one by number or name.
- **Step 2:** Ask where the app is hosted (GCE VM, Laptop/IDE, Compute Engine managed service, GKE, Cloud Run, Other). The GCE VM path is fully implemented: the tool shows a loader while listing VMs alphabetically and lets you choose by number or name.
- **Step 3:** Validate network compatibility (private vs public IP, VPC alignment, PSA/PSC where applicable). It recommends private IP, proposes remediations, and runs `gcloud`/API updates after you consent.
- **Step 4:** Test connectivity and emit language-specific connection snippets tailored to the chosen connectivity method.

## Notes
- The agent runs commands for you once you approve a change—no need to copy/paste `gcloud` yourself.
- Extension metadata lives in `gemini-extension.json` (name: `cloudsql-gce-connector`, version: `2.0.0`).

## Uninstall
```bash
gemini extensions uninstall cloudsql-gce-connector
```

## Files
- `gemini-extension.json` - Extension manifest
- `GEMINI.md` - Detailed behavior/instructions for Cloud SQL ↔ GCE connectivity
- `REDIS_MEMSTORE.md` - Stepwise agent flow to add a Redis Memorystore cache alongside Cloud SQL
