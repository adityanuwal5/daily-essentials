from django.apps import AppConfig


def _enable_sqlite_wal(sender, connection, **kwargs):
    """Enable WAL + a busy timeout on every new SQLite connection.

    WAL (Write-Ahead Logging) lets readers run concurrently with a writer, and
    `busy_timeout` makes a blocked writer wait for the lock rather than raising
    "database is locked". Together with the connection `timeout` set in
    settings, this resolves the 500s seen under concurrent checkouts.

    Done via the `connection_created` signal because the `init_command` OPTION
    for SQLite is only available on Django 5.1+ (this project runs Django 5.0).
    No-op for non-SQLite backends, so it is safe if the DB is later swapped.
    """
    if connection.vendor != "sqlite":
        return
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=20000;")


class ProductsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.products"
    label = "products"
    verbose_name = "Product Catalog"

    def ready(self):
        from django.db.backends.signals import connection_created

        connection_created.connect(
            _enable_sqlite_wal, dispatch_uid="enable_sqlite_wal"
        )
