const PORT = process.env.PORT ?? 8000
const express = require ('express')
const cors = require('cors')
const app = express()
const pool = require('./db')

app.use(cors())

app.get('/beytepenodesrev5', async(req,res) => {
    try {
        const roads = await pool.query('SELECT ST_X(ST_Transform(geom, 4326)) AS longitude, ST_Y(ST_Transform(geom, 4326)) AS latitude , id as node_id, yol_turu, yol_yonu FROM beytepenodesrev5')
        res.json(roads.rows)
    } catch(err) {
        console.error(error)
    }
})



app.get('/beytepe_roads_rev2', async(req,res) => {
    try {
        const roads2 = await pool.query('SELECT start_id, end_id, yol_uzunlk, yol_turu, yol_yonu, ST_AsGeoJSON(ST_Transform(ST_LineMerge(geom), 4326)) AS geom FROM beytepe_roads_rev2')
        res.json(roads2.rows) 
    } catch(err) {
        console.error(error)
    }
})

app.get('/otopark', async(req,res) => {
    try {
        const otopark = await pool.query('SELECT * FROM otopark')
        res.json(otopark.rows)
    } catch(err) {
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


app.listen(PORT,() => {
    console.log(`Server running on PORT: ${PORT}`);
});



