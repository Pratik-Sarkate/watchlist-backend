require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_CLUSTER = process.env.MONGODB_CLUSTER;
const DATABASE = process.env.MONGODB_DATABASE;
const COLLECTION = process.env.MONGODB_COLLECTION;

// Construct connection string with URL-encoded credentials
const CONNECTION_STRING = `mongodb+srv://${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_CLUSTER}/?appName=Cluster0`;

if (
  !MONGODB_USERNAME ||
  !MONGODB_PASSWORD ||
  !MONGODB_CLUSTER ||
  !DATABASE ||
  !COLLECTION
) {
  console.error(
    "[Startup] Missing required env vars: MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_CLUSTER, MONGODB_DATABASE, MONGODB_COLLECTION",
  );
  process.exit(1);
}

let mongoClient = null;

async function getMongoClient() {
  if (mongoClient) return mongoClient;

  const client = new MongoClient(CONNECTION_STRING, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  mongoClient = client;
  console.log("[MongoDB] Connected");
  return mongoClient;
}

function getCollection(client) {
  return client.db(DATABASE).collection(COLLECTION);
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/healthCheck", async (req, res) => {
  try {
    const client = await getMongoClient();
    await client.db("admin").command({ ping: 1 });
    res.status(200).json({
      success: true,
      message: "MongoDB connection successful",
      data: { connected: true, database: DATABASE, collection: COLLECTION },
    });
  } catch (error) {
    console.error("[healthCheck]", error.message);
    res.status(400).json({ error: error.message });
  }
});

// ── Save Watchlists ───────────────────────────────────────────────────────────
app.post("/saveWatchlists", async (req, res) => {
  try {
    const { watchlists, userId } = req.body;

    if (!watchlists || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: watchlists, userId" });
    }

    const client = await getMongoClient();
    const col = getCollection(client);

    const result = await col.updateOne(
      { _id: `tv-watchlists-${userId}` },
      { $set: { data: watchlists, userId, updatedAt: new Date() } },
      { upsert: true },
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
    res.status(400).json({ error: error.message });
  }
});

// ── Fetch Watchlists ──────────────────────────────────────────────────────────
app.post("/fetchWatchlists", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const client = await getMongoClient();
    const col = getCollection(client);

    const document = await col.findOne({ _id: `tv-watchlists-${userId}` });

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
    res.status(400).json({ error: error.message });
  }
});

// ── Root ──────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    version: "2.0.0",
    timestamp: new Date(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB database: ${DATABASE}, collection: ${COLLECTION}`);
});
