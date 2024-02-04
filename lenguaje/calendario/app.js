const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');

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
app.use('/css', express.static(__dirname + '/css'));
app.use(express.json());

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

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

function getEventCollection() {
  const database = client.db('LENGUA_CASTELLANA');
  return database.collection('eventos');
}

app.get('/obtenerEventos', async (req, res) => {
  try {
    const eventCollection = getEventCollection();
    const eventos = await eventCollection.find({}).toArray();
    const eventosFormateados = eventos.map(evento => ({
      _id: evento._id.toString(),
      title: evento.evento,
      start: evento.fecha_inicio,
      end: evento.fecha_fin,
      color: evento.color_evento
    }));
    res.json(eventosFormateados);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


app.post('/crearEvento', async (req, res) => {
  const { evento, fecha_inicio, fecha_fin, color_evento } = req.body;
  if (!evento || !fecha_inicio || !fecha_fin || !color_evento) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  const eventCollection = getEventCollection();
  try {
    const insertResult = await eventCollection.insertOne({
      evento,
      fecha_inicio,
      fecha_fin,
      color_evento,
    });
    if (insertResult.acknowledged ) {
      res.status(200).json({ message: 'Evento creado exitosamente' });
    } else {
      res.status(500).json({ message: 'Error al crear el evento' });
    }
  } catch (error) {
    console.error('Error al insertar el evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.put('/modificarEvento/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  const { evento, fecha_inicio, fecha_fin, color_evento } = req.body;
  if (!evento || !fecha_inicio || !fecha_fin || !color_evento) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  const eventCollection = getEventCollection();
  try {
    const updateResult = await eventCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          evento,
          fecha_inicio,
          fecha_fin,
          color_evento,
        },
      }
    );
    if (updateResult.acknowledged)  {
      res.status(200).json({ message: 'Evento modificado exitosamente' });
    } else {
      res.status(404).json({ message: 'Evento no encontrado' });
    }
  } catch (error) {
    console.error('Error al modificar el evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.delete('/eliminarEvento/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  const eventCollection = getEventCollection();
  try {
    const deleteResult = await eventCollection.deleteOne({
      _id: new ObjectId(eventId),
    });
    if (deleteResult.acknowledged) {
      res.status(200).json({ message: 'Evento eliminado exitosamente' });
    } else {
      res.status(404).json({ message: 'Evento no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
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
