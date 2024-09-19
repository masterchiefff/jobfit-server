// userModel.js
const knex = require('knex')(require('../knexfile'));
const bcrypt = require('bcryptjs');

async function registerUser(userData) {
    const { username, email, firstName, lastName, phoneNumber, country, zipCode, password } = userData;

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [newUser] = await knex('Users').insert({
            username,
            email,
            firstName,
            lastName,
            phoneNumber,
            country,
            zipCode,
            password: hashedPassword,
        }).returning('*');

        return newUser; // Return the newly created user
    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique violation error code
            throw new Error('Username already exists. Please choose another one.');
        }
        throw new Error(error.message);
    }
}

module.exports = { registerUser };