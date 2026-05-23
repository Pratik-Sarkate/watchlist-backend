const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let mongoClients = {};

async function getMongoClient(connectionString) {
  const clientKey = Buffer.from(connectionString).toString("base64");

  if (mongoClients[clientKey]) {
    return mongoClients[clientKey];
  }

  const client = new MongoClient(connectionString, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await client.connect();

  mongoClients[clientKey] = client;

  console.log("[MongoDB] Connected");

  return client;
}

app.post("/saveWatchlists", async (req, res) => {
  try {
    const { connectionString, database, collection, watchlists, userId } =
      req.body;

    if (
      !connectionString ||
      !database ||
      !collection ||
      !watchlists ||
      !userId
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const client = await getMongoClient(connectionString);

    const mongoDb = client.db(database);

    const mongoCollection = mongoDb.collection(collection);

    const result = await mongoCollection.updateOne(
      {
        _id: `tv-watchlists-${userId}`,
      },
      {
        $set: {
          data: watchlists,
          userId,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Watchlists saved successfully",
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: !!result.upsertedId,
      },
    });
  } catch (error) {
    console.error("[saveWatchlists]", error.message);

    res.status(400).json({
      error: error.message,
    });
  }
});

app.post("/fetchWatchlists", async (req, res) => {
  try {
    const { connectionString, database, collection, userId } = req.body;

    if (!connectionString || !database || !collection || !userId) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const client = await getMongoClient(connectionString);

    const mongoDb = client.db(database);

    const mongoCollection = mongoDb.collection(collection);

    const document = await mongoCollection.findOne({
      _id: `tv-watchlists-${userId}`,
    });

    if (!document) {
      return res.status(200).json({
        success: true,
        message: "No backup found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Watchlists fetched successfully",
      data: {
        watchlists: document.data || [],
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error("[fetchWatchlists]", error.message);

    res.status(400).json({
      error: error.message,
    });
  }
});

app.post("/healthCheck", async (req, res) => {
  try {
    const { connectionString } = req.body;

    if (!connectionString) {
      return res.status(400).json({
        error: "connectionString is required",
      });
    }

    const client = await getMongoClient(connectionString);

    await client.db("admin").command({
      ping: 1,
    });

    res.status(200).json({
      success: true,
      message: "MongoDB connection successful",
      data: {
        connected: true,
      },
    });
  } catch (error) {
    console.error("[healthCheck]", error.message);

    res.status(400).json({
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    version: "1.0.0",
    timestamp: new Date(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
