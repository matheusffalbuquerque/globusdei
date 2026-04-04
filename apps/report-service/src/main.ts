import express from 'express';
import mongoose from 'mongoose';

const host = process.env.HOST ?? 'localhost';
/**
 * Utilizing 3001 as the default listener port for the Report Service to avoid collisions.
 */
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();
app.use(express.json());

/**
 * Asynchronously establishes a connection to the MongoDB instance upon server boot.
 * The Reporting service utilizes Mongoose specifically for fast aggregations and
 * extraction of the historical metrics stored by the Data Service.
 */
async function connectToMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://admin:pass2025!@localhost:27017/globusdeiAuth?authSource=admin';
  try {
    await mongoose.connect(uri);
    console.log(`[ReportService] Successfully connected to MongoDB for High-Speed Read Streams.`);
  } catch (err) {
    console.error(`[ReportService] MongoDB connection fatal error:`, err);
  }
}

app.get('/', (req, res) => {
  res.send({ message: 'ReportService Data Stream API Active (Express/MongoDB)' });
});

app.listen(port, host, () => {
  connectToMongo();
  console.log(`[ ready ] http://${host}:${port}`);
});
