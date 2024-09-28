// knexfile.js
const connectionString = 'postgresql://postgres:BBRRaQjjyQGxXdKgWFsvzuoHVbhsPobG@junction.proxy.rlwy.net:58743/railway';

module.exports = {
    client: 'pg',
    connection: connectionString
    migrations: {
      tableName: 'knex_migrations'
    }
};
