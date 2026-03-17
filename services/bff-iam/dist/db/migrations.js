import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
function getMigrationsDirectory() {
    return fileURLToPath(new URL('../migrations', import.meta.url));
}
export async function migrateAuthzDatabase(pool) {
    const migrationsDir = getMigrationsDirectory();
    const files = (await readdir(migrationsDir))
        .filter((fileName) => fileName.endsWith('.sql'))
        .sort((left, right) => left.localeCompare(right));
    await pool.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
    const applied = new Set((await pool.query('select name from schema_migrations')).rows.map((row) => row.name));
    for (const fileName of files) {
        if (applied.has(fileName)) {
            continue;
        }
        const sql = await readFile(path.join(migrationsDir, fileName), 'utf8');
        const client = await pool.connect();
        try {
            await client.query('begin');
            await client.query(sql);
            await client.query('insert into schema_migrations(name) values ($1)', [fileName]);
            await client.query('commit');
        }
        catch (error) {
            await client.query('rollback');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
