-- Init script for Testcontainers MSSQL Server
-- Creates test database with Vietnamese_100_CI_AS collation (server-level collation remains default to prevent Msg 17750 sp_getapplock error)
IF DB_ID('saigonvoice_content_test') IS NULL
BEGIN
    CREATE DATABASE saigonvoice_content_test COLLATE Vietnamese_100_CI_AS;
END;
