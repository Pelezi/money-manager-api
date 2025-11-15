#!/bin/sh
set -e

# Config ---------------------------------------------------------------------
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_NAME=money_manager
DB_USER=postgres
BACKUPS_PATH=backups
BACKUP_FILENAME=$DB_NAME.sql
JSON_BACKUP_FILENAME=$DB_NAME.json
# ----------------------------------------------------------------------------

echo "Removing potential existing backups..."
if [ -d "$BACKUPS_PATH" ]; then rm -Rf $BACKUPS_PATH; fi

echo "Creating a folder to handle backups"
mkdir $BACKUPS_PATH && cd $BACKUPS_PATH

echo "Removing potential existing backup file..."
if [ -f "$BACKUPS_PATH/$BACKUP_FILENAME" ]; then rm -f "$BACKUPS_PATH/$BACKUP_FILENAME"; fi

echo "Backuping remote render db..."
pg_dump -d $DATABASE_URL > ${BACKUP_FILENAME}

echo "Dropping local db..."
dropdb --username=postgres $DB_NAME

echo "Recreating local db..."
createdb --owner=postgres --username=postgres $DB_NAME

echo "Restoring local db from backup..."
psql -d $DB_NAME -f $BACKUP_FILENAME --username=postgres

# echo "RESTORE_REMOTE=true detected. Preparing to restore remote database from ${BACKUP_FILENAME}."

# pg_restore --dbname=$DATABASE_URL --verbose --clean --if-exists --no-owner --no-privileges --format=directory backups/backup/money_manager