import mysql, { Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

const dbConfig = {
  host: process.env.DB_HOST || '153.92.15.3',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'u571416603_spentic_admin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u571416603_spentic_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

export const pool: Pool =
  global.__mysqlPool ||
  mysql.createPool(dbConfig);

if (process.env.NODE_ENV !== 'production') {
  global.__mysqlPool = pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

export default pool;
