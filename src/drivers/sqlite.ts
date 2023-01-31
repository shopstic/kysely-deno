import {
  SqliteDatabase as ISqliteDatabase,
  SqliteStatement as ISqliteStatement,
} from "https://esm.sh/kysely@0.23.4?pin=v106";
import {
  BindValue,
  Database as Sqlite3Database,
  DatabaseOpenOptions as Sqlite3DatabaseOpenOptions,
  Statement as Sqlite3Statement,
} from "https://deno.land/x/sqlite3@0.7.3/mod.ts";
import ffi from "https://deno.land/x/sqlite3@0.7.3/src/ffi.ts";

class SqliteStatementImpl implements ISqliteStatement {
  constructor(readonly statement: Sqlite3Statement) {}
  get reader() {
    return ffi.sqlite3_column_count(this.statement.unsafeHandle) > 0;
  }
  all(parameters: ReadonlyArray<unknown>): unknown[] {
    return this.statement.all.apply(this.statement, parameters as BindValue[]);
  }
  run(parameters: ReadonlyArray<unknown>): {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  } {
    this.statement.values.apply(this.statement, parameters as BindValue[]);
    return {
      changes: this.statement.db.changes,
      lastInsertRowid: this.statement.db.lastInsertRowId,
    };
  }
}

export class SqliteDatabase implements ISqliteDatabase {
  readonly db: Sqlite3Database;
  constructor(path: string | URL, options: Sqlite3DatabaseOpenOptions = {}) {
    this.db = new Sqlite3Database(path, options);
  }
  close(): void {
    return this.db.close();
  }
  prepare(sql: string): ISqliteStatement {
    return new SqliteStatementImpl(this.db.prepare(sql));
  }
}
