// @deno-types="npm:@types/pg"
import pg from "npm:pg";
import { CamelCasePlugin, Kysely, Migrator, PostgresDialect } from "https://esm.sh/kysely@0.23.4?pin=v106";
import { Database, run, upPostgres } from "./shared.ts";

const { Pool } = pg;

console.log("one");
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      user: "postgres",
      password: "mysecretpassword",
      database: "postgres",
      host: "localhost",
      port: 5432,
    }),
  }),
  log(event) {
    if (event.level === "query") {
      console.log(">>>", event.query.sql, event.query.parameters);
    }
  },
  plugins: [new CamelCasePlugin()],
});
console.log("two");

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

console.log("three");
const migrationResult = await migrator.migrateToLatest();
console.log("four");

if (migrationResult.error) {
  console.log("Migration failed", migrationResult);
  Deno.exit(1);
} else {
  await run(db);
  db.destroy();
}
