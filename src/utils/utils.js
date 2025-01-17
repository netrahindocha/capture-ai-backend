const cohere = require("../configs/cohere");

const generateSummary = async (text, params = {}) => {
  try {
    const {
      format = "bullets",
      length = "short",
      extractiveness = "low",
    } = params;

    const response = await cohere.chat({
      model: "command-r-plus-08-2024",
      messages: [
        {
          role: "user",
          content: `Generate a ${format} summary of this text, with ${length} length and ${extractiveness} extractiveness:\n${text}`,
        },
      ],
    });

    // Log the entire response to debug
    console.log("Cohere API response:", response);

    // Check if response has the expected structure
    if (
      response &&
      response.message &&
      Array.isArray(response.message.content) &&
      response.message.content.length > 0
    ) {
      const summaryText = response.message.content[0].text;
      console.log("Generated Summary:", summaryText);
      return summaryText;
    } else {
      throw new Error("Unexpected response structure or content format.");
    }
  } catch (error) {
    console.error("Error with Cohere API:", error);
    throw new Error("Failed to generate summary");
  }
};

module.exports = { generateSummary };
