const mysql = require('mysql2');

const DEFAULT_CLIENT = 'mysql';

function inferClientName(rawValue) {
    const normalized = String(rawValue || DEFAULT_CLIENT).trim().toLowerCase();
    if (normalized === 'postgres' || normalized === 'postgresql' || normalized === 'supabase') {
        return 'postgres';
    }
    return 'mysql';
}

function toArrayParams(params) {
    if (params === undefined || params === null) return [];
    return Array.isArray(params) ? params : [params];
}

function extractInsertIdFromRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0 || !rows[0] || typeof rows[0] !== 'object') {
        return null;
    }

    const firstRow = rows[0];
    const firstKey = Object.keys(firstRow)[0];
    if (!firstKey) return null;

    const rawValue = firstRow[firstKey];
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeSqlForPostgres(sqlText, inputParams) {
    let sql = String(sqlText || '');
    let params = [...toArrayParams(inputParams)];

    // Convert MySQL quoted identifiers to PostgreSQL quoted identifiers.
    sql = sql.replace(/`([^`]+)`/g, '"$1"');

    if (/INFORMATION_SCHEMA\.(COLUMNS|TABLES)/i.test(sql) && /TABLE_SCHEMA\s*=\s*\?/i.test(sql)) {
        sql = sql.replace(/TABLE_SCHEMA\s*=\s*\?/ig, 'TABLE_SCHEMA = current_schema()');
        if (params.length > 0) {
            params = params.slice(1);
        }
    }

    sql = sql.replace(/TABLE_SCHEMA\s*=\s*DATABASE\(\)/ig, 'TABLE_SCHEMA = current_schema()');
    sql = sql.replace(/DATABASE\(\)/ig, 'current_database()');
    sql = sql.replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/ig, 'SERIAL PRIMARY KEY');
    sql = sql.replace(/\bDATETIME\b/ig, 'TIMESTAMP');
    sql = sql.replace(/GROUP_CONCAT\s*\(([^)]+)\)/ig, "string_agg(($1)::text, ',')");

    let index = 0;
    sql = sql.replace(/\?/g, () => `$${++index}`);

    return { sql, params };
}

function parseQueryArgs(paramsOrCallback, maybeCallback) {
    if (typeof paramsOrCallback === 'function') {
        return { params: [], callback: paramsOrCallback };
    }
    return { params: toArrayParams(paramsOrCallback), callback: maybeCallback };
}

function createPgConnection(client) {
    const runQuery = async (sql, params = []) => {
        const normalized = normalizeSqlForPostgres(sql, params);
        const result = await client.query(normalized.sql, normalized.params);

        if (result.command === 'SELECT' || result.command === 'WITH') {
            return result.rows;
        }

        let insertId = null;
        if (result.command === 'INSERT') {
            insertId = extractInsertIdFromRows(result.rows);
            if (!Number.isFinite(insertId)) {
                try {
                    const lastIdResult = await client.query('SELECT LASTVAL() AS insert_id');
                    const fallbackId = Number(lastIdResult.rows?.[0]?.insert_id);
                    insertId = Number.isFinite(fallbackId) ? fallbackId : null;
                } catch (error) {
                    insertId = null;
                }
            }
        }

        return {
            affectedRows: result.rowCount,
            insertId
        };
    };

    return {
        query(sql, paramsOrCallback, maybeCallback) {
            const { params, callback } = parseQueryArgs(paramsOrCallback, maybeCallback);
            const queryPromise = runQuery(sql, params);

            if (typeof callback === 'function') {
                queryPromise.then((payload) => callback(null, payload)).catch((error) => callback(error));
                return;
            }

            return queryPromise.then((payload) => [payload]);
        },
        async beginTransaction(callback) {
            const txPromise = client.query('BEGIN');
            if (typeof callback === 'function') {
                txPromise.then(() => callback(null)).catch((error) => callback(error));
                return;
            }
            await txPromise;
        },
        async commit(callback) {
            const commitPromise = client.query('COMMIT');
            if (typeof callback === 'function') {
                commitPromise.then(() => callback(null)).catch((error) => callback(error));
                return;
            }
            await commitPromise;
        },
        async rollback(callback) {
            const rollbackPromise = client.query('ROLLBACK');
            if (typeof callback === 'function') {
                rollbackPromise.then(() => callback(null)).catch((error) => callback(error));
                return;
            }
            await rollbackPromise;
        },
        release() {
            client.release();
        }
    };
}

function createPostgresAdapter(config) {
    // Lazy require keeps MySQL mode working even before `pg` is installed.
    const { Pool } = require('pg');

    const pool = new Pool({
        connectionString: config.connectionString,
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        max: config.connectionLimit || 10,
        ssl: config.ssl
    });

    const queryWithPool = async (sql, params = []) => {
        const client = await pool.connect();
        try {
            const connection = createPgConnection(client);
            const [result] = await connection.query(sql, params);
            return result;
        } finally {
            client.release();
        }
    };

    return {
        query(sql, paramsOrCallback, maybeCallback) {
            const { params, callback } = parseQueryArgs(paramsOrCallback, maybeCallback);
            const queryPromise = queryWithPool(sql, params);

            if (typeof callback === 'function') {
                queryPromise.then((payload) => callback(null, payload)).catch((error) => callback(error));
                return;
            }

            return queryPromise;
        },
        getConnection(callback) {
            pool.connect()
                .then((client) => callback(null, createPgConnection(client)))
                .catch((error) => callback(error));
        },
        promise() {
            return {
                getConnection: async () => {
                    const client = await pool.connect();
                    return createPgConnection(client);
                },
                query: async (sql, params = []) => {
                    const result = await queryWithPool(sql, params);
                    return [result];
                }
            };
        },
        async end() {
            await pool.end();
        }
    };
}

function createMySqlAdapter(config) {
    return mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: config.connectionLimit || 10
    });
}

function createDatabaseClient(config = {}) {
    const client = inferClientName(config.client);
    if (client === 'postgres') {
        return createPostgresAdapter(config);
    }
    return createMySqlAdapter(config);
}

module.exports = {
    createDatabaseClient,
    inferClientName
};
