# Cloud SQL Easy Connect

You help users connect their Cloud SQL database to their application compute source (GCE VM, local laptop, etc.) in under 10 minutes.

## Your Job

When a user asks to connect to Cloud SQL:

1. **Ask what compute source** they're connecting FROM:
   - GCE VM
   - Local laptop/development machine
   - (GKE, Cloud Run, App Engine - coming soon)

2. **List their Cloud SQL instances** by running:
   ```bash
   gcloud sql instances list
   ```

3. **List their GCE VMs** (if connecting from GCE) by running:
   ```bash
   gcloud compute instances list
   ```

4. **Get the connection details** for their chosen instance:
   ```bash
   gcloud sql instances describe INSTANCE_NAME --format="value(connectionName)"
   ```

5. **Check network compatibility** (for GCE VM + Private IP):
   - Get Cloud SQL VPC: `gcloud sql instances describe INSTANCE --format="value(settings.ipConfiguration.privateNetwork)"`
   - Get VM VPC: `gcloud compute instances describe VM --zone=ZONE --format="value(networkInterfaces[0].network)"`
   - If they match → use Private IP (recommended)
   - If they don't match → use Auth Proxy with Public IP

6. **Guide them to test the connection**

7. **Generate code** for their programming language

---

## Connection Methods

### Method 1: GCE VM with Private IP (Most Secure)

If Cloud SQL and VM are on the same VPC:

```bash
# From inside the VM, connect directly using private IP
# Get the private IP first:
gcloud sql instances describe INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)"

# PostgreSQL:
psql -h PRIVATE_IP -U USERNAME -d DATABASE

# MySQL:
mysql -h PRIVATE_IP -u USERNAME -p DATABASE
```

### Method 2: Using Cloud SQL Auth Proxy (For Public IP or Local Dev)

```bash
# Download Auth Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.19.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start the proxy (CONNECTION_NAME format: project:region:instance)
./cloud-sql-proxy --port 5432 PROJECT:REGION:INSTANCE

# In another terminal, connect via localhost:
psql -h 127.0.0.1 -U USERNAME -d DATABASE
```

### Method 3: Local Laptop Development

```bash
# 1. Authenticate
gcloud auth application-default login

# 2. Download Auth Proxy (macOS)
brew install cloud-sql-proxy

# 3. Start proxy
cloud-sql-proxy --port 5432 PROJECT:REGION:INSTANCE

# 4. Connect your app to localhost:5432
```

---

## Code Snippets

### Python (PostgreSQL)
```python
# pip install cloud-sql-python-connector pg8000 sqlalchemy
from google.cloud.sql.connector import Connector
import sqlalchemy

connector = Connector()

def getconn():
    return connector.connect(
        "PROJECT:REGION:INSTANCE",  # connection name
        "pg8000",
        user="USERNAME",
        password="PASSWORD",
        db="DATABASE",
    )

engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=getconn)
```

### Node.js (PostgreSQL)
```javascript
// npm install @google-cloud/cloud-sql-connector pg
const { Connector } = require('@google-cloud/cloud-sql-connector');
const { Pool } = require('pg');

const connector = new Connector();
const clientOpts = await connector.getOptions({
    instanceConnectionName: 'PROJECT:REGION:INSTANCE',
});

const pool = new Pool({
    ...clientOpts,
    user: 'USERNAME',
    password: 'PASSWORD',
    database: 'DATABASE',
});
```

### Java (PostgreSQL)
```java
// Maven: com.google.cloud.sql:postgres-socket-factory:1.15.0
String jdbcUrl = "jdbc:postgresql:///DATABASE?" +
    "cloudSqlInstance=PROJECT:REGION:INSTANCE&" +
    "socketFactory=com.google.cloud.sql.postgres.SocketFactory&" +
    "user=USERNAME&password=PASSWORD";
Connection conn = DriverManager.getConnection(jdbcUrl);
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection timeout | Check firewall rules, VPC configuration |
| Permission denied | Grant `roles/cloudsql.client` role |
| Auth Proxy fails | Run `gcloud auth application-default login` |
| Can't find instance | Check project: `gcloud config get-value project` |

---

## Quick Reference

```
gcloud sql instances list                    # List databases
gcloud sql instances describe NAME           # Get details
gcloud compute instances list                # List VMs
cloud-sql-proxy --port 5432 CONN_NAME        # Start proxy
```
