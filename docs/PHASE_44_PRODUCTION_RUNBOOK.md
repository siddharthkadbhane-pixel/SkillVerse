# SkillVerse Phase 44: Production Migration Execution Runbook

**Document Version:** 1.0  
**Target Environment:** Neon Serverless PostgreSQL 18.6 (`neondb`)  
**Direct Endpoint:** `ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech` (Port 5432)  
**Pooler Endpoint:** `ep-flat-rice-ao8kdffq-pooler.c-2.ap-southeast-1.aws.neon.tech` (Port 5432)  
**Security Standard:** Strict Zero-CLI-Password Policy (PGPASSFILE / Non-CLI Secret Ingestion)  
**Status:** APPROVED OPERATIONAL PROCEDURE FOR CONTROLLED CUTOVER

---

## 1. Safety Gate & Pre-Migration Safeguards (Neon Console)

1. **Create Point-in-Time Recovery Snapshot Branch:**
   In the Neon Console (Project `tiny-night-04715217`), create a zero-copy backup branch:
   - Branch Name: `pre-phase44-prod-snapshot-20261030`
   - Parent Branch: `br-lucky-dawn-ao4a6rww` (current HEAD)
2. **Maintenance Announcement:**
   Announce a 15-minute maintenance window for the SkillVerse closed beta environment.

---

## 2. DBA Credential Authentication Protocol (PGPASSFILE)

All CLI operations MUST use `PGPASSFILE` to prevent process inspection (`ps aux`, `/proc/<pid>/cmdline`, Windows Process Explorer) and shell history leaks.

### Setup PGPASSFILE:

#### Linux / macOS:
```bash
PGPASS_DIR=$(mktemp -d)
export PGPASSFILE="$PGPASS_DIR/pgpass"
cat <<EOF > "$PGPASSFILE"
ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech:5432:neondb:neondb_owner:${NEONDB_OWNER_PW}
EOF
chmod 0600 "$PGPASSFILE"
```

#### Windows PowerShell:
```powershell
$pgpassFile = Join-Path $env:TEMP "pgpass_phase44.conf"
Set-Content -Path $pgpassFile -Value "ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech:5432:neondb:neondb_owner:$NEONDB_OWNER_PW"
icacls $pgpassFile /inheritance:r /grant:r "$($env:USERNAME):R"
$env:PGPASSFILE = $pgpassFile
```

---

## 3. Step-by-Step Migration Lifecycle

```mermaid
flowchart TD
    S1["1. Forward Role Provisioning (as neondb_owner via PGPASSFILE)"] --> S2["2. Credential Activation (CSPRNG via stdin)"]
    S2 --> S3["3. Better Auth Migration (as skillverse_migrator via PGPASSFILE)"]
    S3 --> S4["4. Hardened Verification Queries (Catalog Audit)"]
    S4 --> S5["5. Vercel Production Environment Cutover"]
    S5 --> S6["6. Application Smoke Tests & Monitoring"]
```

### Step 1: Forward Role Migration (Execute as `neondb_owner`)
Execute forward role provisioning and dynamic object ownership transfer over the direct endpoint:
```bash
psql -h ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432 -v ON_ERROR_STOP=1 -f database/migrations/phase44-least-privilege-roles.sql
```
*Outcome:* Roles `skillverse_app` and `skillverse_migrator` created with `NOLOGIN`. All 123 public tables, sequences, and enums transferred to `skillverse_migrator`.

### Step 2: Secure Credential Activation (In-Memory CSPRNG via stdin)
Generate two distinct 32-byte (64-char hex) CSPRNG secrets:
```bash
APP_HEX=$(openssl rand -hex 32)
MIGRATOR_HEX=$(openssl rand -hex 32)
```

Activate roles via `stdin` without writing passwords to disk or passing them in CLI arguments:
```bash
psql -h ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432 -v ON_ERROR_STOP=1 -X -q <<EOF
ALTER ROLE skillverse_app WITH LOGIN PASSWORD '${APP_HEX}';
ALTER ROLE skillverse_migrator WITH LOGIN PASSWORD '${MIGRATOR_HEX}';
EOF
```

### Step 3: Better Auth Migration (Execute as `skillverse_migrator`)
Append `skillverse_migrator` credentials to the secure `PGPASSFILE`:
```bash
echo "ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech:5432:neondb:skillverse_migrator:${MIGRATOR_HEX}" >> "$PGPASSFILE"
```

Execute idempotent Better Auth DDL over direct compute:
```bash
psql -h ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech -U skillverse_migrator -d neondb -p 5432 -v ON_ERROR_STOP=1 -f database/migrations/phase44-better-auth-migration.sql
```

### Step 4: Schema & Permission Verification Gate
Execute verification queries (via `psql` using `PGPASSFILE`):

```sql
-- 4.1 Verify Table Ownership (Must return 0 rows)
SELECT schemaname, tablename, tableowner
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND tableowner <> 'skillverse_migrator';

-- 4.2 Verify Enum Ownership (Must return 0 rows)
SELECT n.nspname AS schema_name, t.typname AS enum_name, r.rolname AS owner
FROM pg_catalog.pg_type t
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
JOIN pg_catalog.pg_roles r ON r.oid = t.typowner
WHERE n.nspname = 'public' AND t.typtype = 'e' AND r.rolname <> 'skillverse_migrator';

-- 4.3 Verify skillverse_app Discrete Permissions
SELECT 
  has_table_privilege('skillverse_app', 'public.users', 'SELECT') AS can_select,
  has_table_privilege('skillverse_app', 'public.users', 'INSERT') AS can_insert,
  has_table_privilege('skillverse_app', 'public.users', 'UPDATE') AS can_update,
  has_table_privilege('skillverse_app', 'public.users', 'DELETE') AS can_delete,
  has_table_privilege('skillverse_app', 'public.users', 'TRUNCATE') AS can_truncate,
  has_schema_privilege('skillverse_app', 'public', 'CREATE') AS can_create_in_schema;
-- Expected: can_select=t, can_insert=t, can_update=t, can_delete=t, can_truncate=f, can_create_in_schema=f
```

### Step 5: Vercel Production Environment Cutover
In Vercel Project Settings > Environment Variables (Production):
1. Set `APP_DATABASE_URL`:
   `postgres://skillverse_app:[APP_HEX]@ep-flat-rice-ao8kdffq-pooler.c-2.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require`
2. **Delete / Remove:** `DATABASE_URL` and `DIRECT_URL`.
3. Trigger a production deployment in Vercel to activate the new configuration.

### Step 6: Application Smoke Tests & Clean Teardown
1. Test authentication signup, signin, session persistence, and email verification.
2. Confirm Vercel runtime logs show successful singleton pool initialization without administrative warnings.
3. **Secure Cleanup:**
   - Linux/macOS: `shred -u "$PGPASSFILE" && rm -rf "$PGPASS_DIR"`
   - Windows PowerShell: `Remove-Item -Path $pgpassFile -Force; $env:PGPASSFILE = $null`

