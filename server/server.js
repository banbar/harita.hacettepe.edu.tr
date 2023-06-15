// process.env.PORT çevre değişkenini alır, eğer tanımlanmamışsa 8000 varsayılan bir değer olarak kullanılır
// gets the environment variable process.env.PORT, if not defined, 8000 is used as a default value
const PORT = process.env.PORT ?? 8000

// express modülünü alır
// gets the express module
const express = require ('express')

// cors modülünü alır
// gets the cors module
const cors = require('cors')

// Express uygulamasını oluşturur
// Creates the Express application
const app = express()

// db.js dosyasından pool nesnesini alır
// gets pool object from db.js
const pool = require('./db')

// CORS ayarlarını yapılandırır
// Configures CORS settings
app.use(cors())

app.get('/beytepenodesrev5', async(req,res) => {
    try {
        // queries data from beytepenodesrev5 table
        // beytepenodesrev5 tablosundan verileri sorgular
        const roads = await pool.query('SELECT ST_X(ST_Transform(geom, 4326)) AS longitude, ST_Y(ST_Transform(geom, 4326)) AS latitude , id as node_id, yol_turu, yol_yonu FROM beytepenodesrev5')
        // Sorgu sonuçlarını JSON formatında yanıt olarak döndürür
        // Returns the query results as a response in JSON format
        res.json(roads.rows)
    } catch(err) {
        // Hata durumunda hata mesajını konsola yazdırır
        // Prints the error message to the console in case of error
        console.error(error)
    }
})



app.get('/beytepe_roads_rev2', async(req,res) => {
    try {
        // queries data from beytepe_roads_rev2 table
        // beytepe_roads_rev2 tablosundan verileri sorgular
        const roads2 = await pool.query('SELECT start_id, end_id, yol_uzunlk, yol_turu, yol_yonu, ST_AsGeoJSON(ST_Transform(ST_LineMerge(geom), 4326)) AS geom FROM beytepe_roads_rev2')
        // Sorgu sonuçlarını JSON formatında yanıt olarak döndürür
        // Returns the query results as a response in JSON format
        res.json(roads2.rows) 
    } catch(err) {
        // Hata durumunda hata mesajını konsola yazdırır
        // Prints the error message to the console in case of error
        console.error(error)
    }
})

app.get('/otopark', async(req,res) => {
    try {
        // queries data from otopark table
        // otopark tablosundan verileri sorgular
        const otopark = await pool.query('SELECT * FROM otopark')
        // Sorgu sonuçlarını JSON formatında yanıt olarak döndürür
        // Returns the query results as a response in JSON format
        res.json(otopark.rows)
    } catch(err) {
        // Hata durumunda hata mesajını konsola yazdırır
        // Prints the error message to the console in case of error
        console.error(error)
    }
})

app.get('/bina', async(req,res) => {
    try {
        // queries data from binalar table
        // binalar tablosundan verileri sorgular
        const bina = await pool.query('SELECT ST_X(ST_Transform(geom, 4326)) AS longitude, ST_Y(ST_Transform(geom, 4326)) AS latitude , id , web_site , bina_name FROM bina')
        // Sorgu sonuçlarını JSON formatında yanıt olarak döndürür
        // Returns the query results as a response in JSON format
        res.json(bina.rows)
    } catch(err) {
        // Hata durumunda hata mesajını konsola yazdırır
        // Prints the error message to the console in case of error
        console.error(error)
    }
})

app.get('/binalar', async(req,res) => {
    try {
        const binalar = await pool.query('SELECT * FROM binalar')
        res.json(binalar.rows)
    } catch(err) {
        console.error(error)
    }
})

//belirtilen port üzerinde sunucuyu dinlemeye başlar.
//starts listening to the server on the specified port.
app.listen(PORT,() => {
    console.log(`Server running on PORT: ${PORT}`);
});



