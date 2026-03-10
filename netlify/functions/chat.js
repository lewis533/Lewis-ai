exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, history, imageBase64, imageType } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    // Build the contents array for Gemini
    const contents = [];

    // Add chat history
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content || '' }]
        });
      });
    }

    // Build current user message parts
    const parts = [];

    // If an image was attached, add it first
    if (imageBase64 && imageType) {
      parts.push({
        inlineData: {
          mimeType: imageType,
          data: imageBase64
        }
      });
    }

    // Add the text prompt
    if (text) {
      parts.push({ text });
    } else if (imageBase64) {
      parts.push({ text: 'What is in this image?' });
    }

    contents.push({ role: 'user', parts });

    const model = 'gemini-1.5-flash-latest';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 8192,
          },
          systemInstruction: {
            parts: [{
              text: "You are a helpful, accurate and knowledgeable AI assistant. Answer any question the user asks — whether it's about science, math, coding, history, current events, creative writing, advice, or anything else. Give complete, well-reasoned answers. Use markdown formatting (bold, lists, code blocks) where it makes the response clearer. Never refuse a reasonable question. If you don't know something, say so honestly."
            }]
          }
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Gemini API error:', data);
      return {
        statusCode: res.status,
        body: JSON.stringify({ answer: 'API error: ' + (data.error?.message || 'Unknown error') })
      };
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ answer: 'Server error. Please try again.' })
    };
  }
};
