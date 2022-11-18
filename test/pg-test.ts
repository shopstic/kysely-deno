import { CamelCasePlugin, Kysely, Migrator, PostgresDialect } from "https://esm.sh/@shopstic/kysely@0.22.0";
import { PostgresPool } from "../src/drivers/postgres.ts";
import { Database, run, upPostgres } from "./shared.ts";

const pgPool = new PostgresPool({
  user: "postgres",
  password: "mysecretpassword",
  database: "postgres",
  hostname: "localhost",
  port: 5432,
}, {
  max: 10,
  maxWaitingClients: 10,
  testOnBorrow: true,
  acquireTimeoutMillis: 5000,
  evictionRunIntervalMillis: 1000,
  idleTimeoutMillis: 5000,
});

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: pgPool,
  }),
  log(event) {
    if (event.level === "query") {
      console.log(">>>", event.query.sql, event.query.parameters);
    }
  },
  plugins: [new CamelCasePlugin()],
});

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("pet").execute();
  await db.schema.dropTable("person").execute();
}

const migrator = new Migrator({
  db,
  provider: {
    getMigrations() {
      return Promise.resolve({
        "2022_11_01_00_init": {
          up: upPostgres,
          down,
        },
      });
    },
  },
});

const migrationResult = await migrator.migrateToLatest();

if (migrationResult.error) {
  console.log("Migration failed", migrationResult);
  Deno.exit(1);
} else {
  await run(db);
  db.destroy();
}
