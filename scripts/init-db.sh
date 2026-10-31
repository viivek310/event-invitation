#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=app_password="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE invitation_app LOGIN PASSWORD :'app_password';
GRANT CONNECT ON DATABASE invitations TO invitation_app;
GRANT USAGE ON SCHEMA public TO invitation_app;
ALTER DEFAULT PRIVILEGES FOR ROLE invitation_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO invitation_app;
ALTER DEFAULT PRIVILEGES FOR ROLE invitation_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO invitation_app;
SQL
