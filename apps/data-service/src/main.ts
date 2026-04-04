import express from 'express';
import mongoose from 'mongoose';

const host = process.env.HOST ?? 'localhost';
/**
 * Utilizing 3000 as the default listener port for the main analytics Data Service.
 */
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use(express.json());

/**
 * Asynchronously establishes a connection to the MongoDB instance upon server boot.
 * According to architecture, MongoDB is utilized exclusively for unstructured data, 
 * AI analytics logs, and overarching historical event tracking.
 */
async function connectToMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://admin:pass2025!@localhost:27017/globusdeiAuth?authSource=admin';
  try {
    await mongoose.connect(uri);
    console.log(`[DataService] Successfully connected to MongoDB for AI Analytics & Logs.`);
  } catch (err) {
    console.error(`[DataService] MongoDB connection fatal error:`, err);
  }
}

app.get('/', (req, res) => {
  res.send({ message: 'DataService Analytics API Active (Express/MongoDB)' });
});

app.listen(port, host, () => {
  connectToMongo();
  console.log(`[ ready ] http://${host}:${port}`);
});
