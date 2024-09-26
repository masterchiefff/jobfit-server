/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('CVs', function(table) {
        table.increments('id').primary(); // Primary key
        table.integer('userId').unsigned().references('id').inTable('Users'); // Foreign key referencing Users table
        table.string('filename').notNullable(); // Name of the uploaded CV file
        table.text('content').notNullable(); // Content of the CV (text extracted from the file)
        table.timestamps(true, true); // Created at and updated at timestamps
    });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('CVs');
};
