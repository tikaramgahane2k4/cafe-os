const mongoose = require("mongoose");

const LOCAL_FALLBACK_URI = "mongodb://localhost:27017/cafeos";
const MAX_ATTEMPTS = 5;
const INITIAL_BACKOFF_MS = 1000;
const SERVER_SELECTION_TIMEOUT_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMongoHost = (uri) => {
  if (!uri) {
    return "unknown-host";
  }

  try {
    const parsedUri = new URL(uri);
    return parsedUri.host || parsedUri.hostname || "unknown-host";
  } catch (error) {
    const withoutProtocol = uri.replace(/^mongodb(?:\+srv)?:\/\//i, "");
    const withoutCredentials = withoutProtocol.includes("@")
      ? withoutProtocol.split("@").slice(1).join("@")
      : withoutProtocol;

    return withoutCredentials.split("/")[0] || "unknown-host";
  }
};

const getConnectionType = (uri) => {
  if (!uri) {
    return "atlas";
  }

  try {
    const parsedUri = new URL(uri);
    const protocol = parsedUri.protocol.toLowerCase();
    const host = parsedUri.hostname.toLowerCase();

    if (protocol === "mongodb+srv:" || host.includes("mongodb.net")) {
      return "atlas";
    }

    if (["localhost", "127.0.0.1", "::1"].includes(host)) {
      return "local";
    }
  } catch (error) {
    if (uri.toLowerCase().includes("localhost")) {
      return "local";
    }
  }

  return "atlas";
};

const getFullErrorMessage = (error) => {
  if (!error) {
    return "Unknown MongoDB error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return `${error.name || "Error"}: ${error.message}`;
  }

  return String(error);
};

const getKnownIssueHint = (message) => {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("ip not whitelisted") ||
    (normalizedMessage.includes("whitelist") && normalizedMessage.includes("ip"))
  ) {
    return "Add your IP to MongoDB Atlas Network Access (0.0.0.0/0)";
  }

  if (
    normalizedMessage.includes("authentication failed") ||
    normalizedMessage.includes("bad auth") ||
    normalizedMessage.includes("auth failed")
  ) {
    return "Check username/password and URL encoding";
  }

  if (normalizedMessage.includes("enotfound")) {
    return "DNS or internet issue";
  }

  return null;
};

const resetConnectionState = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error(`[MongoDB] Cleanup failed: ${getFullErrorMessage(error)}`);
  }
};

const connectWithRetries = async (uri, options = {}) => {
  const { type = getConnectionType(uri), successLabel = `Connected (${type})` } = options;
  const host = getMongoHost(uri);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    console.log(`[MongoDB] Attempt ${attempt} (${type}) host=${host}`);

    try {
      const connection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      });

      console.log(`[MongoDB] ${successLabel} host=${connection.connection.host}`);
      return connection;
    } catch (error) {
      const fullErrorMessage = getFullErrorMessage(error);

      console.error(
        `[MongoDB] Failed (${type}) host=${host} attempt=${attempt}: ${fullErrorMessage}`
      );

      const knownIssueHint = getKnownIssueHint(fullErrorMessage);
      if (knownIssueHint) {
        console.error(`[MongoDB] Hint: ${knownIssueHint}`);
      }

      await resetConnectionState();

      if (attempt === MAX_ATTEMPTS) {
        break;
      }

      const retryDelayMs = INITIAL_BACKOFF_MS * 2 ** (attempt - 1);
      console.log(`[MongoDB] Retrying in ${retryDelayMs / 1000}s...`);
      await sleep(retryDelayMs);
    }
  }

  return null;
};

const connectDB = async () => {
  const atlasUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : "";
  const primaryConnectionType = getConnectionType(atlasUri);

  if (!atlasUri) {
    throw new Error(
      "[MongoDB] MONGO_URI is missing. Add your MongoDB Atlas connection string to server/.env before starting the server."
    );
  }

  const atlasConnection = await connectWithRetries(atlasUri, {
    type: primaryConnectionType,
    successLabel: `Connected (${primaryConnectionType})`,
  });

  if (atlasConnection) {
    return atlasConnection;
  }

  if (primaryConnectionType !== "atlas") {
    throw new Error(
      `[MongoDB] Unable to connect to MongoDB using the configured local host ${getMongoHost(atlasUri)}.`
    );
  }

  console.error(
    `[MongoDB] Atlas connection failed after ${MAX_ATTEMPTS} attempts. Trying local fallback at ${LOCAL_FALLBACK_URI}`
  );

  const localConnection = await connectWithRetries(LOCAL_FALLBACK_URI, {
    type: "local",
    successLabel: "Connected (local fallback)",
  });

  if (localConnection) {
    return localConnection;
  }

  throw new Error(
    `[MongoDB] Unable to connect to MongoDB. Atlas failed after ${MAX_ATTEMPTS} attempts and local fallback ${LOCAL_FALLBACK_URI} is unavailable.`
  );
};

module.exports = connectDB;


