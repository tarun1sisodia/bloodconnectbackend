const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

module.exports = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env file");
  }

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  global.__MONGOD__ = mongod;

  await mongoose.connect(uri, { useNewUrlParser: true });
};
