const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');
const {ObjectId} = require('mongodb');
const express = require('express');
const multer = require('multer');
const mimeTypes = require('mime-types');
const fs = require('fs');
const path = require('path');

dotenv.config();
const port = 3000;
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();
app.use(express.static(path.join(__dirname)));

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

function getDocumentosCollection() {
  const database = client.db('LENGUA_CASTELLANA');
  return database.collection('documentos');
}

function getImagenesCollection() {
  const database = client.db('LENGUA_CASTELLANA');
  return database.collection('imagenes');
}

app.post("/documentos", upload.single('documento'), async (req, res) => {
  try {
    const documentosCollection = getDocumentosCollection();
    const result = await documentosCollection.insertOne({
      filename: req.file.originalname,
      content: req.file.buffer.toString('base64'), // Convert file content to base64
    });
    res.send(`Document added to 'documentos' collection with ID: ${result.insertedId}`);
  } catch (error) {
    res.status(500).send('Error adding document to documentos collection');
  }
});

app.post("/imagenes", upload.single('imagen'), async (req, res) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  const fileType = mimeTypes.lookup(req.file.originalname);
  if (!allowedTypes.includes(fileType)) {
    return res.status(400).send('Invalid file type. Only JPG and PNG are allowed.');
  }
  try {
    const imagenesCollection = getImagenesCollection();
    const result = await imagenesCollection.insertOne({
      filename: req.file.originalname,
      content: req.file.buffer.toString('base64'), // Convert file content to base64
    });
    res.send(`Image added to 'imagenes' collection with ID: ${result.insertedId}`);
  } catch (error) {
    res.status(500).send('Error adding image to imagenes collection');
  }
});

app.delete("/documentos/:id", async (req, res) => {
  try {
    const documentosCollection = getDocumentosCollection();
    const result = await documentosCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.send(`Document deleted from 'documentos' collection. Deleted count: ${result.deletedCount}`);
  } catch (error) {
    res.status(500).send('Error deleting document from documentos collection');
  }
});

app.delete("/imagenes/:id", async (req, res) => {
  try {
    const imagenesCollection = getImagenesCollection();
    const result= await imagenesCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.send(`Image deleted from 'imagenes' collection. Deleted count: ${result.deletedCount}`);
  } catch (error) {
    res.status(500).send('Error deleting image from imagenes collection');
  }
});

app.get('/imagenes/gallery/:galleryNumber', async (req, res) => {
  const galleryNumber = req.params.galleryNumber;
  try {
    const imagenesCollection = getImagenesCollection();
    const images = await imagenesCollection.find({ galleryNumber: galleryNumber }).toArray();
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Error fetching images');
  }
});

app.get('/documentos/:id', async (req, res) => {
    try {
      const documentosCollection = getDocumentosCollection();
      const document = await documentosCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (document) {
          const content = Buffer.from(document.content, 'base64');
          res.setHeader('Content-Disposition', `attachment; filename=${document.filename}`);
          res.setHeader('Content-Type', 'application/octet-stream');
          res.send(content);
        } else {
        res.status(404).send('Document not found');
        }
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).send('Error downloading document');
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

run().catch(console.dir);
