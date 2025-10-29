const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

module.exports = async () => {
  const mongoUri = process.env.MONGODB_URI_TEST;

  if (!mongoUri) {
    throw new Error('MONGODB_URI_TEST is not defined in .env file');
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  global.__MONGO_URI__ = mongoUri;
};
