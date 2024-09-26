const knex = require('knex')(require('../knexfile'));

class CV {
    // Create a new CV entry
    static async create(data) {
        return await knex('CVs').insert(data).returning('*');
    }

    // Find a CV by its ID
    static async findById(id) {
        return await knex('CVs').where({ id }).first();
    }

    // Find all CVs
    static async findAll() {
        return await knex('CVs').select('*');
    }

    // Update a CV by its ID
    static async updateById(id, data) {
        return await knex('CVs').where({ id }).update(data).returning('*');
    }

    // Delete a CV by its ID
    static async deleteById(id) {
        return await knex('CVs').where({ id }).del();
    }

    // Find all CVs by user ID
    static async findByUserId(userId) {
        return await knex('CVs').where({ userId });
    }

    // Count total number of CVs
    static async count() {
        const result = await knex('CVs').count('* as total');
        return result[0].total;
    }
}

module.exports = CV;