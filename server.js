const shortid = require("shortid");
const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const mongoose = require("mongoose"); // Import mongoose for MongoDB
const app = express();
const PORT = 3000; // You can use any available port
const fs = require("fs").promises;

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(
    process.env.MONGOOSE_URL
  )
  .then(() => {
    //listen to the requests
    app.listen(PORT, () => {
      console.log("connected to db & listening to PORT", PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });

// Define schema for MongoDB
const dataSchema = new mongoose.Schema({
  uid: String,
  userName: String,
  Data: Object,
}, { timestamps: true });
const categorySchema = new mongoose.Schema({
  userName: String,
  password: String,
});

// Define model based on schema
const DataModel = mongoose.model("sdp1", dataSchema);
const CategoryModel = mongoose.model("sdp1CategoryList", categorySchema);


app.post("/data", (req, res) => {
  const { title, description, quantity, user } = req.body;
  console.log("Received data:");
  const products = generateProducts({title,description},quantity,user);
  console.log(products);
  res.status(200).json(products);
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username is already taken
    const existingUser = await CategoryModel.findOne({ userName: username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user record
    const newUser = new CategoryModel({
      userName: username,
      password: hashedPassword,
    });

    // Save the user record to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find user by username
    const user = await CategoryModel.findOne({ userName: username });

    if (user) {
      // Compare passwords
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        console.log('match',match)
        // Passwords match, user authenticated
        res.status(200).json({ username: username });
      } else {
        // Passwords don't match
        res.status(401).json({ error: "Invalid username or password" });
      }
    } else {
      // User not found
      res.status(401).json({ error: "Invalid username" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});



app.get("/data/:uid", async (req, res) => {
  const uid = req.params.uid;
  const data = await DataModel.findOne({ uid: uid });
  console.log("Fetched data:", data ? data : "wrong ID");
  res.status(200).json(data);
});
app.get("/category/:user", async (req, res) => {
  const userName = req.params.user;
  const data = await DataModel.find({ userName: userName });
  console.log("Fetched data:", data ? data : "wrong ID");
  res.status(200).json(data);
});

function generateProducts(Data, quantity, user) {
  const products = [];
  for (let i = 0; i < quantity; i++) {
    const uid = shortid.generate();
    const product = {
      ID: uid,
      ...Data,
    };
    products.push(product);
    saveToMongoDB(uid, Data, user);
  }
  return products;
}

async function saveToMongoDB(uid, Data, user) {
  try {
    await DataModel.create({
      uid: uid,
      userName: user,
      Data: Data,
    });
    console.log("Data saved to MongoDB");
  } catch (err) {
    console.error("Error saving data to MongoDB:", err);
  }
}

