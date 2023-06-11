const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// mongodb connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7kcf4qx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      
      const classCollection = client.db("photoDB").collection("classes");
      const cartCollection = client.db("photoDB").collection("carts");


      app.get('/classes', async (req, res) => {
          const result = await classCollection.find().toArray()
          res.send(result)
      })


    //   cart collection
      app.post('/carts', async (req, res) => {
          const item = req.body;
          const result = await cartCollection.insertOne(item)
          res.send(result)
      })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SHUTTER SNAP ACADEMY SERVER IS LOADING...");
});

app.listen(port, () => {
  console.log(`SHUTTER SNAP SERVER IS LOADING ON PORT : ${port}`);
});
