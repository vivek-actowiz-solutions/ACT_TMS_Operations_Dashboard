import mongoose from "mongoose";

const dbConnections = {};

 const useDb = async (req, res, next) => {
  try {
    // Decide DB based on query param, header, or path
    const dbName = "mydatabase"

    if (!dbConnections[dbName]) {
      dbConnections[dbName] = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`Connected to DB: ${dbName}`);
    }

    // Attach the connection to req
    req.db = dbConnections[dbName];
    next();
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).send("Database connection error");
  }
};

export default useDb;
