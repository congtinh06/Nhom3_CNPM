# Database operations

## Scope

The system uses one Microsoft SQL Server 2022 instance through Docker Compose. Five service databases are created by `docker/init-databases.sql`:

- `echora_auth_db`
- `echora_content_db`
- `echora_translation_db`
- `echora_analytics_db`
- `echora_order_db`

Schema changes are managed by Flyway. Hibernate `ddl-auto` is set to `validate`.

## Build database from scratch

1. Copy `.env.example` to `.env` and fill required secrets.
2. Start the stack:

```powershell
docker compose up -d --build
```

3. Wait for the SQL Server healthcheck and let each service run Flyway migrations automatically.
4. Run demo seeds when needed:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/seed-demo.ps1
```

## Backup and restore

Backup a database:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1 -BackupDir F:\echora-backup
```

Restore one database:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-db.ps1 -BackupFile F:\echora-backup\echora_auth_db_YYYYMMDD-HHmmss.bak -Database echora_auth_db
```

Restore must run while the `mssql` service is running.

## Add a new migration

1. Create a new versioned migration in the relevant service:

```text
backend/<service>/src/main/resources/db/migration/V<next>__<description>.sql
```

2. Let Flyway run it on service startup.
3. Do not edit an already applied `V*` migration because Flyway checksum validation may fail.

## Demo seeds

Demo seeds live in `docker/demo-seed`. The runner is `scripts/seed-demo.ps1`. Demo seed files should be idempotent and should not delete production or real user data.

## Operational rules

- Do not use `docker compose down -v` for stored data.
- Keep real data out of Git.
- Keep connection secrets in `.env` or GitHub Secrets.
