const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: '*' // Allows all origins. For production, you might want to restrict this to your actual domain.
}));
app.use(bodyParser.json());

const mongoUri = "mongodb+srv://divyamtalwar15:YOUR_PASSWORD_HERE@cluster0.75gu677.mongodb.net/posthog-events?retryWrites=true&w=majority";
const client = new MongoClient(mongoUri);

let db;

async function connectToMongo() {
    try {
        await client.connect();
        db = client.db("posthog-events");
        console.log('Connected to MongoDB and selected database: posthog-events');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

connectToMongo();

app.post('/api/log-event', async (req, res) => {
    console.log('Received request to /api/log-event');
    console.log('Request body:', req.body);

    const eventData = req.body;

    if (!eventData || !eventData.event) {
        return res.status(400).json({ error: 'Invalid event data' });
    }

    try {
        const collection = db.collection('events');
        const result = await collection.insertOne(eventData);
        console.log('Event logged successfully to MongoDB:', result.insertedId);
        res.status(201).json({ message: 'Event logged successfully', insertedId: result.insertedId });
    } catch (err) {
        console.error('Error inserting event into MongoDB', err);
        res.status(500).json({ error: 'Failed to log event' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});
