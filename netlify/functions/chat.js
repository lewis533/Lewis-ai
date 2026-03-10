const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { statusCode: 200, body: JSON.stringify({ answer: "⚠️ Netlify Key Missing" }) };

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const { text, history, imageBase64, imageType } = JSON.parse(event.body);

    const cleanHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(h.content || " ") }]
    }));

    const chat = model.startChat({ history: cleanHistory });

    let result;
    if (imageBase64 && imageType) {
      result = await chat.sendMessage([
        { inlineData: { mimeType: imageType, data: imageBase64 } },
        { text: text || "What is in this image?" }
      ]);
    } else {
      result = await chat.sendMessage(text || "Hello");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: result.response.text() }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ answer: `System Note: ${err.message}` })
    };
  }
};
