// pg modülünü Pool adı altında alıyoruz
// we get the pg module under the name Pool
const Pool = require('pg').Pool
// dotenv modülünü kullanarak çevre değişkenlerine erişiyoruz
// access environment variables using the dotenv module
require("dotenv").config()
// Yeni bir Pool nesnesi oluşturuyoruz
// Create a new Pool object
const pool = new Pool({
    user: 'postgres', // Veritabanı kullanıcı adı //database user name
    password: '*****', // Veritabanı şifresi //database password
    host: 'localhost', // Veritabanı sunucusunun IP adresi veya alan adı //IP address or domain name of the database server
    port: 5432, // Veritabanı sunucusunun bağlantı noktası // Port of the database server
    database:'hacettepekampus' // Kullanılacak veritabanının adı // Name of the database to use

})
// pool nesnesini dışa aktarıyoruz, başka modüller tarafından kullanılabilir hale getiriyoruz
// export the pool object, making it available to other modules
module.exports = pool

