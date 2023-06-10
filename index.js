const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;


// middlewares
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('SHUTTER SNAP ACADEMY SERVER IS LOADING...')
})

app.listen(port, () => {
    console.log(`SHUTTER SNAP SERVER IS LOADING ON PORT : ${port}`)
})