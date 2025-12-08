#!/usr/bin/env node

/**
 * Cloud SQL Easy Connect - MCP Server
 * Provides callable tools for Gemini CLI to connect Cloud SQL to compute resources
 */

const { spawn } = require('child_process');

// Simple MCP server implementation
class CloudSQLMCPServer {
  constructor() {
    this.tools = {
      'list_cloudsql_instances': {
        description: 'List all Cloud SQL instances in the current project',
        parameters: {},
        handler: this.listCloudSQLInstances.bind(this)
      },
      'describe_cloudsql_instance': {
        description: 'Get detailed information about a Cloud SQL instance including connection name and IP addresses',
        parameters: {
          instance_name: { type: 'string', description: 'Name of the Cloud SQL instance', required: true }
        },
        handler: this.describeCloudSQLInstance.bind(this)
      },
      'list_gce_vms': {
        description: 'List all GCE VMs in the current project',
        parameters: {},
        handler: this.listGCEVMs.bind(this)
      },
      'describe_gce_vm': {
        description: 'Get network details of a GCE VM',
        parameters: {
          vm_name: { type: 'string', description: 'Name of the VM', required: true },
          zone: { type: 'string', description: 'Zone of the VM', required: true }
        },
        handler: this.describeGCEVM.bind(this)
      },
      'check_network_compatibility': {
        description: 'Check if a GCE VM can connect to a Cloud SQL instance (VPC match)',
        parameters: {
          sql_instance: { type: 'string', description: 'Cloud SQL instance name', required: true },
          vm_name: { type: 'string', description: 'GCE VM name', required: true },
          zone: { type: 'string', description: 'VM zone', required: true }
        },
        handler: this.checkNetworkCompatibility.bind(this)
      },
      'get_connection_code': {
        description: 'Generate connection code for a specific programming language',
        parameters: {
          language: { type: 'string', description: 'Programming language (python, nodejs, java, go)', required: true },
          connection_name: { type: 'string', description: 'Cloud SQL connection name (project:region:instance)', required: true },
          db_type: { type: 'string', description: 'Database type (postgresql, mysql)', required: true },
          ip_type: { type: 'string', description: 'IP type (private, public)', required: false }
        },
        handler: this.getConnectionCode.bind(this)
      }
    };
  }

  async runCommand(cmd, args = []) {
    return new Promise((resolve, reject) => {
      const process = spawn(cmd, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => { stdout += data; });
      process.stderr.on('data', (data) => { stderr += data; });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });

      process.on('error', reject);
    });
  }

  async listCloudSQLInstances() {
    try {
      const result = await this.runCommand('gcloud', [
        'sql', 'instances', 'list',
        '--format=json'
      ]);
      const instances = JSON.parse(result);
      return {
        success: true,
        instances: instances.map(i => ({
          name: i.name,
          databaseVersion: i.databaseVersion,
          region: i.region,
          state: i.state,
          hasPrivateIP: !!i.ipAddresses?.find(ip => ip.type === 'PRIVATE'),
          hasPublicIP: !!i.ipAddresses?.find(ip => ip.type === 'PRIMARY')
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async describeCloudSQLInstance(params) {
    try {
      const result = await this.runCommand('gcloud', [
        'sql', 'instances', 'describe', params.instance_name,
        '--format=json'
      ]);
      const instance = JSON.parse(result);
      return {
        success: true,
        instance: {
          name: instance.name,
          connectionName: instance.connectionName,
          region: instance.region,
          databaseVersion: instance.databaseVersion,
          ipAddresses: instance.ipAddresses,
          privateNetwork: instance.settings?.ipConfiguration?.privateNetwork,
          authorizedNetworks: instance.settings?.ipConfiguration?.authorizedNetworks
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listGCEVMs() {
    try {
      const result = await this.runCommand('gcloud', [
        'compute', 'instances', 'list',
        '--format=json'
      ]);
      const vms = JSON.parse(result);
      return {
        success: true,
        vms: vms.map(vm => ({
          name: vm.name,
          zone: vm.zone?.split('/').pop(),
          status: vm.status,
          internalIP: vm.networkInterfaces?.[0]?.networkIP,
          externalIP: vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP,
          network: vm.networkInterfaces?.[0]?.network?.split('/').pop()
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async describeGCEVM(params) {
    try {
      const result = await this.runCommand('gcloud', [
        'compute', 'instances', 'describe', params.vm_name,
        '--zone=' + params.zone,
        '--format=json'
      ]);
      const vm = JSON.parse(result);
      return {
        success: true,
        vm: {
          name: vm.name,
          zone: params.zone,
          network: vm.networkInterfaces?.[0]?.network?.split('/').pop(),
          subnetwork: vm.networkInterfaces?.[0]?.subnetwork?.split('/').pop(),
          internalIP: vm.networkInterfaces?.[0]?.networkIP,
          externalIP: vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP,
          serviceAccount: vm.serviceAccounts?.[0]?.email
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkNetworkCompatibility(params) {
    try {
      // Get Cloud SQL VPC
      const sqlResult = await this.runCommand('gcloud', [
        'sql', 'instances', 'describe', params.sql_instance,
        '--format=value(settings.ipConfiguration.privateNetwork)'
      ]);
      const sqlVPC = sqlResult.split('/').pop();

      // Get VM VPC
      const vmResult = await this.runCommand('gcloud', [
        'compute', 'instances', 'describe', params.vm_name,
        '--zone=' + params.zone,
        '--format=value(networkInterfaces[0].network)'
      ]);
      const vmVPC = vmResult.split('/').pop();

      const compatible = sqlVPC === vmVPC;

      return {
        success: true,
        compatible,
        sqlVPC: sqlVPC || '(no private IP configured)',
        vmVPC,
        recommendation: compatible
          ? 'Networks match! You can use Private IP connection.'
          : sqlVPC
            ? 'Networks differ. Consider: 1) Use Public IP with Auth Proxy, 2) Set up VPC peering, or 3) Move VM to same VPC'
            : 'Cloud SQL has no Private IP. Enable it or use Public IP with Auth Proxy.'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getConnectionCode(params) {
    const { language, connection_name, db_type, ip_type = 'private' } = params;
    const ipTypeUpper = ip_type.toUpperCase();

    const templates = {
      python: {
        postgresql: `# Install: pip install cloud-sql-python-connector pg8000 sqlalchemy

from google.cloud.sql.connector import Connector
import sqlalchemy

connector = Connector()

def getconn():
    return connector.connect(
        "${connection_name}",
        "pg8000",
        user="YOUR_USER",
        password="YOUR_PASSWORD",
        db="YOUR_DATABASE",
        ip_type="${ipTypeUpper}"
    )

engine = sqlalchemy.create_engine("postgresql+pg8000://", creator=getconn)

with engine.connect() as conn:
    result = conn.execute(sqlalchemy.text("SELECT 1"))
    print(result.fetchone())

connector.close()`,
        mysql: `# Install: pip install cloud-sql-python-connector pymysql sqlalchemy

from google.cloud.sql.connector import Connector
import sqlalchemy

connector = Connector()

def getconn():
    return connector.connect(
        "${connection_name}",
        "pymysql",
        user="YOUR_USER",
        password="YOUR_PASSWORD",
        db="YOUR_DATABASE",
        ip_type="${ipTypeUpper}"
    )

engine = sqlalchemy.create_engine("mysql+pymysql://", creator=getconn)

with engine.connect() as conn:
    result = conn.execute(sqlalchemy.text("SELECT 1"))
    print(result.fetchone())

connector.close()`
      },
      nodejs: {
        postgresql: `// Install: npm install @google-cloud/cloud-sql-connector pg

const { Connector } = require('@google-cloud/cloud-sql-connector');
const { Pool } = require('pg');

async function connect() {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
        instanceConnectionName: '${connection_name}',
        ipType: '${ipTypeUpper}',
    });

    const pool = new Pool({
        ...clientOpts,
        user: 'YOUR_USER',
        password: 'YOUR_PASSWORD',
        database: 'YOUR_DATABASE',
    });

    const result = await pool.query('SELECT NOW()');
    console.log(result.rows);

    await pool.end();
    connector.close();
}

connect();`,
        mysql: `// Install: npm install @google-cloud/cloud-sql-connector mysql2

const { Connector } = require('@google-cloud/cloud-sql-connector');
const mysql = require('mysql2/promise');

async function connect() {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
        instanceConnectionName: '${connection_name}',
        ipType: '${ipTypeUpper}',
    });

    const conn = await mysql.createConnection({
        ...clientOpts,
        user: 'YOUR_USER',
        password: 'YOUR_PASSWORD',
        database: 'YOUR_DATABASE',
    });

    const [rows] = await conn.execute('SELECT NOW()');
    console.log(rows);

    await conn.end();
    connector.close();
}

connect();`
      },
      java: {
        postgresql: `// Maven: com.google.cloud.sql:postgres-socket-factory:1.15.0

String jdbcUrl = String.format(
    "jdbc:postgresql:///%s?" +
    "cloudSqlInstance=%s&" +
    "socketFactory=com.google.cloud.sql.postgres.SocketFactory&" +
    "ipTypes=${ipTypeUpper}&" +
    "user=%s&password=%s",
    "YOUR_DATABASE", "${connection_name}", "YOUR_USER", "YOUR_PASSWORD"
);

Connection conn = DriverManager.getConnection(jdbcUrl);`,
        mysql: `// Maven: com.google.cloud.sql:mysql-socket-factory:1.15.0

String jdbcUrl = String.format(
    "jdbc:mysql:///%s?" +
    "cloudSqlInstance=%s&" +
    "socketFactory=com.google.cloud.sql.mysql.SocketFactory&" +
    "ipTypes=${ipTypeUpper}&" +
    "user=%s&password=%s",
    "YOUR_DATABASE", "${connection_name}", "YOUR_USER", "YOUR_PASSWORD"
);

Connection conn = DriverManager.getConnection(jdbcUrl);`
      },
      go: {
        postgresql: `// Install: go get cloud.google.com/go/cloudsqlconn github.com/jackc/pgx/v5

package main

import (
    "context"
    "database/sql"
    "cloud.google.com/go/cloudsqlconn"
    "github.com/jackc/pgx/v5/stdlib"
)

func main() {
    d, _ := cloudsqlconn.NewDialer(context.Background(),
        cloudsqlconn.WithDefaultDialOptions(cloudsqlconn.With${ip_type === 'private' ? 'Private' : 'Public'}IP()))

    config, _ := pgx.ParseConfig("user=YOUR_USER password=YOUR_PASSWORD dbname=YOUR_DATABASE")
    config.DialFunc = func(ctx context.Context, _, _ string) (net.Conn, error) {
        return d.Dial(ctx, "${connection_name}")
    }

    db, _ := sql.Open("pgx", stdlib.RegisterConnConfig(config))
    defer db.Close()
}`,
        mysql: `// Install: go get cloud.google.com/go/cloudsqlconn github.com/go-sql-driver/mysql

package main

import (
    "context"
    "database/sql"
    "cloud.google.com/go/cloudsqlconn"
    "github.com/go-sql-driver/mysql"
)

func main() {
    d, _ := cloudsqlconn.NewDialer(context.Background(),
        cloudsqlconn.WithDefaultDialOptions(cloudsqlconn.With${ip_type === 'private' ? 'Private' : 'Public'}IP()))

    mysql.RegisterDialContext("cloudsql", func(ctx context.Context, _ string) (net.Conn, error) {
        return d.Dial(ctx, "${connection_name}")
    })

    db, _ := sql.Open("mysql", "YOUR_USER:YOUR_PASSWORD@cloudsql(${connection_name})/YOUR_DATABASE")
    defer db.Close()
}`
      }
    };

    const code = templates[language]?.[db_type];
    if (!code) {
      return {
        success: false,
        error: `Unsupported combination: ${language} + ${db_type}. Supported: python/nodejs/java/go with postgresql/mysql`
      };
    }

    return {
      success: true,
      language,
      db_type,
      ip_type,
      code
    };
  }

  // MCP Protocol handlers
  handleRequest(request) {
    const { method, params } = request;

    switch (method) {
      case 'initialize':
        return {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'cloudsql-easy-connect', version: '1.0.0' }
        };

      case 'tools/list':
        return {
          tools: Object.entries(this.tools).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema: {
              type: 'object',
              properties: tool.parameters,
              required: Object.entries(tool.parameters)
                .filter(([_, p]) => p.required)
                .map(([name]) => name)
            }
          }))
        };

      case 'tools/call':
        const tool = this.tools[params.name];
        if (!tool) {
          return { error: { code: -32601, message: `Unknown tool: ${params.name}` } };
        }
        return tool.handler(params.arguments || {});

      default:
        return { error: { code: -32601, message: `Unknown method: ${method}` } };
    }
  }

  start() {
    let buffer = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const request = JSON.parse(line);
          const response = await this.handleRequest(request);

          const result = {
            jsonrpc: '2.0',
            id: request.id,
            result: response.error ? undefined : response,
            error: response.error
          };

          process.stdout.write(JSON.stringify(result) + '\n');
        } catch (e) {
          process.stderr.write(`Error: ${e.message}\n`);
        }
      }
    });
  }
}

const server = new CloudSQLMCPServer();
server.start();
