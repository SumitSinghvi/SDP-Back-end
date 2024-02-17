const shortid = require("shortid");
const express = require("express");
const cors = require("cors");
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
    "mongodb+srv://SumitSinghvi:Sumitiscool!9@mernapp.sf1tx0r.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    Promise.all([
      fs.readFile("/etc/letsencrypt/archive/baruche.store/privkey1.pem", "utf8"),
      fs.readFile("/etc/letsencrypt/archive/baruche.store/cert1.pem", "utf8")
    ]).then(([privateKey, certificate]) => {
      const options = { key: privateKey, cert: certificate };
      const server = https.createServer(options, app);
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }).catch(error => {
      console.error("Error reading SSL certificate and key files:", error);
    });
    console.log("connected to db");
  })
  .catch((error) => {
    console.log(error);
  });

// Define schema for MongoDB
const dataSchema = new mongoose.Schema({
  uid: String,
  userName: String,
  category: String,
  combinedData: Object,
});
const categorySchema = new mongoose.Schema({
  userName: String,
  categoryList: Array,
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
  const { combinedData, quantity, userName, category } = req.body;
  console.log("Received data:");
  const products = generateProducts(combinedData, quantity, userName, category);
  console.log(products);
  res.status(200).json(products);
});
app.post("/categoryList", async (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName) {
    console.log("categoryName:", categoryName);
    return;
  }
  const user = await CategoryModel.findOne({ userName: "Name" });

  if (!user) {
    console.log("User not found");
    return;
  }

  // Append the new element to the list
  user.categoryList.push(categoryName);

  // Save the updated document
  const updatedUser = await user.save();
  console.log("User updated:", updatedUser);
  res.status(200).json(categoryName);
});

app.post("/deleteCategory", async (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName) {
    console.log("categoryName:", categoryName);
    return;
  }
  const user = await CategoryModel.findOne({ userName: "Name" });

  if (!user) {
    console.log("User not found");
    return;
  }

  // Remove the desired item from the dataList
  const itemToRemove = categoryName; // Replace 'item_to_remove' with the item you want to remove
  user.categoryList = user.categoryList.filter(item => item !== itemToRemove);

  // Save the updated document
  const updatedUser = await user.save();
  console.log("User updated:", updatedUser);
  res.status(200).json(categoryName);
});

app.get("/data/:uid", async (req, res) => {
  const uid = req.params.uid;
  const data = await DataModel.findOne({ uid: uid });
  console.log("Fetched data:", data ? data : "wrong ID");
  res.status(200).json(data);
});
app.get("/category/:userName", async (req, res) => {
  const userName = req.params.userName;
  const data = await CategoryModel.find({ userName: userName });
  console.log("Fetched data:", data ? data : "wrong ID");
  res.status(200).json(data);
});

function generateProducts(combinedData, quantity, userName, category) {
  const products = [];
  for (let i = 0; i < quantity; i++) {
    const uid = shortid.generate();
    const product = {
      ID: uid,
      ...combinedData,
    };
    products.push(product);
    saveToMongoDB(uid, userName, category, combinedData);
  }
  return products;
}

async function saveToMongoDB(uid, userName, category, combinedData) {
  try {
    await DataModel.create({
      uid: uid,
      combinedData: combinedData,
      userName: userName,
      category: category,
    });
    console.log("Data saved to MongoDB");
  } catch (err) {
    console.error("Error saving data to MongoDB:", err);
  }
}
