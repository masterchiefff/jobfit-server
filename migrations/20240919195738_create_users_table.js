/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('Users', function(table) {
        table.increments('id').primary();
        table.string('username').notNullable().unique();
        table.string('email').notNullable().unique();
        table.string('firstName').notNullable();
        table.string('lastName').notNullable();
        table.string('phoneNumber');
        table.string('country');
        table.string('zipCode');
        table.string('password').notNullable();
        table.string('profileImage'); // Optional field for profile image
        table.timestamps(true, true); // This creates createdAt and updatedAt fields
    });
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('Users');
};
