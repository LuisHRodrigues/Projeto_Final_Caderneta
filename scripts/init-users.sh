#!/bin/sh
set -eu
# Senhas geradas pelo script de preparação: alfanuméricas, sem interpolação SQL arbitrária.
case "$CADERNETA_DB_PASSWORD$CADERNETA_MIGRATION_PASSWORD" in *[!a-zA-Z0-9]*) echo "Use senhas alfanuméricas no bootstrap SQL" >&2; exit 1;; esac
MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot <<SQL
CREATE USER IF NOT EXISTS 'caderneta_app'@'%' IDENTIFIED BY '$CADERNETA_DB_PASSWORD';
CREATE USER IF NOT EXISTS 'caderneta_migracao'@'%' IDENTIFIED BY '$CADERNETA_MIGRATION_PASSWORD';
GRANT SELECT,INSERT,UPDATE,DELETE ON api_caderneta_database.* TO 'caderneta_app'@'%';
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP,ALTER,INDEX,REFERENCES,CREATE TEMPORARY TABLES,LOCK TABLES ON api_caderneta_database.* TO 'caderneta_migracao'@'%';
SQL
