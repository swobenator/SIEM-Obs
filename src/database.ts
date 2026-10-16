// Shared PostgreSQL connection pool used by API routes and health checks.
import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
});
