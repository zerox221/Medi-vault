import pg from "pg";
import pgvector from "pgvector/pg";

const { Pool } = pg;

let pool = null;
let connectionTested = false;
let connectionAvailable = false;
let verifiedPgvectorVersion = null;
let lastFailureTime = 0;
const FAILURE_RETRY_COOLDOWN_MS = 5000;

/**
 * Safely sanitizes database connection URLs by redacting passwords.
 * Never leaks credentials in console or logs.
 */
export const sanitizeDbUrl = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return url.replace(/:([^:@]+)@/, ":***@");
  }
};

/**
 * Extracts host and database name safely for logging without credentials.
 */
export const getSafeDbInfo = (url) => {
  if (!url) return { host: "unknown", database: "unknown" };
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "unknown",
      port: parsed.port || "5432",
      database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "unknown",
    };
  } catch {
    return { host: "unknown", database: "unknown" };
  }
};

/**
 * Returns configuration object for PostgreSQL connection.
 * Supports Neon cloud PostgreSQL with required SSL.
 */
export const getPostgresConfig = () => {
  const connectionString = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URI ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();

  if (connectionString) {
    const isNeon = connectionString.includes("neon.tech");
    const isSslRequired =
      isNeon ||
      process.env.POSTGRES_SSL === "true" ||
      connectionString.includes("sslmode=require") ||
      connectionString.includes("ssl=true");

    return {
      connectionString,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.POSTGRES_MAX_POOL || "10", 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  // Fallback to individual connection parameters if provided
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER) {
    return {
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
      database: process.env.POSTGRES_DB || process.env.PGDATABASE || "neondb",
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD || "",
      ssl: { rejectUnauthorized: false },
      max: parseInt(process.env.POSTGRES_MAX_POOL || "10", 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return null;
};

/**
 * Checks whether PostgreSQL connection configuration is present
 */
export const isPostgresConfigured = () => {
  return getPostgresConfig() !== null;
};

/**
 * Returns or creates the singleton pg.Pool instance
 */
export const getPostgresPool = () => {
  if (pool) return pool;

  const config = getPostgresConfig();
  if (!config) {
    return null;
  }

  pool = new Pool(config);

  pool.on("error", (err) => {
    console.error("⚠️ [Neon Postgres Pool Error]:", err.message);
  });

  return pool;
};

/**
 * Tests the PostgreSQL connection on backend startup:
 * 1. Requires SSL for Neon connection
 * 2. Creates & verifies 'vector' (pgvector) extension
 * 3. Registers pgvector types
 * 4. Logs connection status without passwords or sensitive credentials
 */
export const testPostgresConnection = async (forceRetry = false) => {
  // If already verified and active, return immediately
  if (!forceRetry && connectionAvailable) {
    return true;
  }

  // Prevent spamming connection attempts if failure happened within 5s cooldown
  const now = Date.now();
  if (!forceRetry && !connectionAvailable && lastFailureTime > 0 && now - lastFailureTime < FAILURE_RETRY_COOLDOWN_MS) {
    return false;
  }

  const p = getPostgresPool();
  if (!p) {
    connectionAvailable = false;
    lastFailureTime = now;
    return false;
  }

  const config = getPostgresConfig();
  const safeInfo = getSafeDbInfo(config?.connectionString);

  let client;
  try {
    client = await p.connect();

    // 1. Check basic connectivity & database timestamp
    const timeRes = await client.query("SELECT NOW() as now, version() as version;");
    const dbNow = timeRes.rows[0]?.now;

    // 2. Enable pgvector extension
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");

    // 3. Register pgvector types for this client
    await pgvector.registerTypes(client);

    // 4. Verify pgvector extension is active and query its version
    const extRes = await client.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
    );

    if (extRes.rows.length === 0) {
      throw new Error("PostgreSQL 'vector' extension is not available.");
    }

    verifiedPgvectorVersion = extRes.rows[0].extversion;
    connectionAvailable = true;
    connectionTested = true;
    lastFailureTime = 0;

    console.log(
      `🐘 [Neon PostgreSQL]: Connected successfully (host: ${safeInfo.host}, db: ${safeInfo.database}) at ${dbNow}`
    );
    console.log(
      `🐘 [pgvector]: Extension verified (version: ${verifiedPgvectorVersion}, SSL: enabled).`
    );

    return true;
  } catch (err) {
    connectionAvailable = false;
    lastFailureTime = Date.now();
    console.error(
      `❌ [PostgreSQL Error]: Failed to connect to Neon PostgreSQL at ${safeInfo.host}: ${err.message}`
    );
    return false;
  } finally {
    if (client) client.release();
  }
};

/**
 * Returns verified pgvector version or null if not yet verified
 */
export const getPgvectorVersion = () => verifiedPgvectorVersion;

/**
 * Resets the connection tested state
 */
export const resetPostgresStatus = () => {
  connectionTested = false;
  connectionAvailable = false;
  verifiedPgvectorVersion = null;
};

/**
 * Closes the PostgreSQL pool
 */
export const closePostgresPool = async () => {
  if (pool) {
    try {
      await pool.end();
    } catch {
      // ignore
    }
    pool = null;
    connectionTested = false;
    connectionAvailable = false;
    verifiedPgvectorVersion = null;
  }
};
