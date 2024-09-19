// knexfile.js
module.exports = {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'sadattmagara254',
      database: 'jobfit'
    },
    migrations: {
      tableName: 'knex_migrations'
    }
};