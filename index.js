const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// const SSLCommerzPayment = require("sslcommerz-lts");
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

// varify jw token

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};




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

// sslcommerze payment gateways
// const store_id = process.env.SOTRE_ID;
// const store_passwd = process.env.STORE_PASS;
// const is_live = false



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("photoDB").collection("users");
    const classCollection = client.db("photoDB").collection("classes");
    const cartCollection = client.db("photoDB").collection("carts");
    const myclassCollection = client.db("photoDB").collection("myclass");

    // JW Token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7days",
      });
      res.send({ token });
    });

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
    // verify instructor
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    // Users collection

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

     app.get("/users/admin/:email", verifyJWT, async (req, res) => {
       const email = req.params.email;

       if (req.decoded.email !== email) {
         res.send({ admin: false });
       }

       const query = { email: email };
       const user = await usersCollection.findOne(query);
       const result = { admin: user?.role === "admin" };
       res.send(result);
     });
    
    
     app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
       const email = req.params.email;

       if (req.decoded.email !== email) {
         res.send({ instructor: false });
       }

       const query = { email: email };
       const user = await usersCollection.findOne(query);
       const result = { instructor: user?.role === "instructor" };
       res.send(result);
     });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateUser = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateUser);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateUser = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, updateUser);
      res.send(result);
    });

    // Classes Collection
    app.get("/classes", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    // myclass collection
    app.get('/myclass', async (req, res) => {
      const result = await myclassCollection.find().toArray();
      res.send(result);
    })

    app.post(
      "/myclass",
      verifyJWT,
      verifyAdmin,
      verifyInstructor,
      async (req, res) => {
        const item = req.body;
        const result = await myclassCollection.insertOne(item);
        res.send(result);
      }
    );

    app.patch("/myclass/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateClass = {
        $set: {
          status: "approved",
        },
      };
      const result = await myclassCollection.updateOne(filter, updateClass);
      res.send(result);
    });

    app.patch("/myclass/deny/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateClass = {
        $set: {
          status: "denyed",
        },
      };
      const result = await myclassCollection.updateOne(filter, updateClass);
      res.send(result);
    });

    //   cart collection
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post(
      "/carts",
      verifyJWT,
      verifyAdmin,
      verifyInstructor,
      async (req, res) => {
        const item = req.body;
        const result = await cartCollection.insertOne(item);
        res.send(result);
      }
    );

    app.delete("/carts/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

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
