use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create tables",
        sql: include_str!("../migrations/sql/init.sql").into(),
        kind: MigrationKind::Up,
    }]
}
