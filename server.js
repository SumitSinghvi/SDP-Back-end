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

// Connect to the database file
// const db = new sqlite3.Database('my_database.db', (err) => {
//   if (err) {
//     console.error('Error opening database:', err.message);
//   } else {
//     console.log('Connected to the SQLite database.');
//   }
// });
// // Create a new table if it doesn't exist
// db.run(`CREATE TABLE IF NOT EXISTS userdata (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   userName TEXT,
//   Data TEXT
// )`);

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://SumitSinghvi:Sumitiscool!9@mernapp.sf1tx0r.mongodb.net/?retryWrites=true&w=majority"
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

// const server = http.createServer(app,{
//   cors:{
//     origin:"*",
//   }
// });

// POST endpoint to handle incoming data
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
      const match = bcrypt.compare(password, user.password);
      if (match) {
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
  // const data = await getUserData(userName);
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
  // handleExcel(user, products)
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

// const getUserData = (username) => {
//   return new Promise((resolve, reject) => {
//     db.get('SELECT data FROM userdata WHERE userName = ?', [username], (err, row) => {
//       if (err) {
//         reject(err);
//       } else {
//         if (row) {
//           resolve(row);
//         } else {
//           resolve(null);
//         }
//       }
//     });
//   });
// };

// function handleExcel(user, products) {
//   return new Promise((resolve, reject) => {
//     const serializedData = JSON.stringify(products);
//     db.run('INSERT INTO userdata (userName, Data) VALUES (?, ?)', [user, serializedData], function(err) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(this.lastID);
//       }
//     });
//   });
// }

// app.post("/deleteCategory", async (req, res) => {
//   const { categoryName } = req.body;
//   if (!categoryName) {
//     console.log("categoryName:", categoryName);
//     return;
//   }
//   const user = await CategoryModel.findOne({ userName: "Name" });

//   if (!user) {
//     console.log("User not found");
//     return;
//   }

//   // Remove the desired item from the dataList
//   const itemToRemove = categoryName; // Replace 'item_to_remove' with the item you want to remove
//   user.categoryList = user.categoryList.filter(item => item !== itemToRemove);

//   // Save the updated document
//   const updatedUser = await user.save();
//   console.log("User updated:", updatedUser);
//   res.status(200).json(categoryName);
// });
// app.post("/categoryList", async (req, res) => {
//   const { categoryName } = req.body;
//   if (!categoryName) {
//     console.log("categoryName:", categoryName);
//     return;
//   }
//   const user = await CategoryModel.findOne({ userName: "Name" });

//   if (!user) {
//     console.log("User not found");
//     return;
//   }

//   // Append the new element to the list
//   user.categoryList.push(categoryName);

//   // Save the updated document
//   const updatedUser = await user.save();
//   console.log("User updated:", updatedUser);
//   res.status(200).json(categoryName);
// });