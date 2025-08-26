import knex from "knex";
import { env } from "../config/env.js";

export const db = knex({
    client: "pg",
    connection: {
        host: env.pg.host,
        port: env.pg.port,
        user: env.pg.user,
        password: env.pg.password,
        database: env.pg.database,
    },
    pool: { min: 0, max: 10 },
});
