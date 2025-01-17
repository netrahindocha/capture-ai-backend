const { CohereClientV2 } = require("cohere-ai");

// Initialize the Cohere client with API key from .env
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

module.exports = cohere;
