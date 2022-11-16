import {
  CompiledQuery,
  Kysely,
  Migrator,
  SqliteDialect,
} from "https://esm.sh/kysely@0.22.0";
import { Database, run, upSqlite } from "./shared.ts";
import { SqliteDatabase } from "../src/drivers/sqlite.ts";

const db = new Kysely<Database>({
  dialect: new SqliteDialect({
    database: new SqliteDatabase("sqlite-test.db"),
    async onCreateConnection(conn) {
      await conn.executeQuery(CompiledQuery.raw("PRAGMA foreign_keys=ON"));
    },
  }),
  log(event) {
    if (event.level === "query") {
      console.log(">>>", event.query.sql, event.query.parameters);
    }
  },
  // plugins: [new CamelCasePlugin()],
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
          up: upSqlite,
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
}
