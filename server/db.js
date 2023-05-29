const Pool = require('pg').Pool
require("dotenv").config()

const pool = new Pool({
    user: 'postgres',
    password: '12345',
    host: 'localhost',
    port: 5432,
    database:'hacettepekampus'

})
module.exports = pool

