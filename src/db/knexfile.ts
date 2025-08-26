import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.PG_HOST || 'db',
      port: Number(process.env.PG_PORT || 5432),
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      database: process.env.PG_DATABASE || 'postgres',
    },
    migrations: {
      directory: path.resolve(__dirname, '../migrations'),
      extension: 'ts'
    }
  }
};

export default config;
