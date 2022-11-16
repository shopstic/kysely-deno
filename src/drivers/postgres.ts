import { Client, ClientOptions, ConnectionString } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import {
  PostgresPool as IPostgresPool,
  PostgresPoolClient as IPostgresPoolClient,
  PostgresQueryResult as IPostgresQueryResult,
} from "https://esm.sh/kysely@0.22.0";
import { createPool, Options as PoolOptions, Pool } from "https://esm.sh/generic-pool@3.9.0";

class PostgresPoolClient {
  constructor(readonly client: Client, readonly onRelease: () => void) {}
  async query<R>(sql: string, parameters: ReadonlyArray<unknown>): Promise<IPostgresQueryResult<R>> {
    const ret = await this.client.queryObject(sql, parameters as unknown[]);

    return {
      command: ret.command as IPostgresQueryResult<R>["command"],
      rowCount: ret.rowCount || 0,
      rows: ret.rows as R[],
    };
  }
  release(): void {
    this.onRelease();
  }
}

// deno-lint-ignore no-explicit-any
const poolProto = (Pool.prototype as any);
poolProto._scheduleEvictorRun = function () {
  if (this._config.evictionRunIntervalMillis > 0) {
    this._scheduledEviction = setTimeout(() => {
      this._evict();
      this._scheduleEvictorRun();
    }, this._config.evictionRunIntervalMillis);
  }
};

export class PostgresPool implements IPostgresPool {
  readonly pool: Pool<Client>;

  constructor(
    connectionParams: ClientOptions | ConnectionString | undefined,
    poolOptions: PoolOptions & { destroyTimeoutMillis?: number },
  ) {
    this.pool = createPool({
      async create() {
        const client = new Client(connectionParams);
        await client.connect();
        return client;
      },
      destroy(client) {
        return client.end();
      },
      async validate(client) {
        try {
          return (await client.queryObject("select 1")).rowCount === 1;
        } catch (e) {
          console.error("A connection failed validation", e);
          return false;
        }
      },
    }, poolOptions);
  }

  async connect(): Promise<IPostgresPoolClient> {
    const underlying = await this.pool.acquire();
    const client = new PostgresPoolClient(underlying, () => this.pool.release(underlying));
    return client as unknown as IPostgresPoolClient;
  }

  end(): Promise<void> {
    return this.pool.drain();
  }
}
