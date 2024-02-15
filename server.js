const shortid = require('shortid');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Import mongoose for MongoDB
const app = express();
const PORT = 3000; // You can use any available port

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://SumitSinghvi:Sumitiscool!9@mernapp.sf1tx0r.mongodb.net/?retryWrites=true&w=majority')
    .then(()=>{
        //listen to the requests
        app.listen(PORT,() => {
        console.log('connected to db & listening to PORT', PORT)
            })
    })
    .catch((error)=>{
        console.log(error)
    })

// Define schema for MongoDB
const dataSchema = new mongoose.Schema({
  uid: String,
  userName: String,
  category: String,
  combinedData: Object
});

// Define model based on schema
const DataModel = mongoose.model('sdp1', dataSchema);

// const server = http.createServer(app,{
//   cors:{
//     origin:"*",
//   }
// });

// POST endpoint to handle incoming data
app.post('/data', (req, res) => {
  const { combinedData, quantity, userName, category } = req.body;
  console.log('Received data:');
  const products = generateProducts(combinedData, quantity, userName, category);
  console.log(products);
  res.status(200).json(products);
});

app.get('/data/:uid', async (req, res) => {
  const uid = req.params.uid;
  const data = await DataModel.findOne({ uid: uid });
  console.log('Fetched data:', data ? data : "wrong ID");
  res.status(200).json(data);
});
app.get('/category/:userName', async (req, res) => {
  const userName = req.params.userName;
  const data = await DataModel.find({ userName: userName });
  console.log('Fetched data:', data ? data : "wrong ID");
  res.status(200).json(data);
});

// Start the server
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

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
    await DataModel.create({ uid: uid, combinedData: combinedData, userName:userName, category:category });
    console.log('Data saved to MongoDB');
  } catch (err) {
    console.error('Error saving data to MongoDB:', err);
  }
}

