const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 12;

const getRetryDelayMs = (error) => {
  const retryInfo = error?.details?.find(
    (detail) =>
      detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
  );
  const retryDelay = retryInfo?.retryDelay;

  if (typeof retryDelay === 'string') {
    const duration = retryDelay.match(
      /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/
    );

    if (duration && duration[0]) {
      return (
        Number(duration[1] || 0) * 60 * 60 * 1000 +
        Number(duration[2] || 0) * 60 * 1000 +
        Number(duration[3] || 0) * 1000
      );
    }
  }

  const messageDelay = error?.message?.match(
    /please retry in\s+(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?/i
  );

  if (!messageDelay) {
    return null;
  }

  return (
    Number(messageDelay[1] || 0) * 60 * 60 * 1000 +
    Number(messageDelay[2] || 0) * 60 * 1000 +
    Number(messageDelay[3] || 0) * 1000
  );
};

const formatQuotaResetTime = (retryAt) => {
  const timeZone = process.env.APP_TIME_ZONE || 'Asia/Kolkata';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(retryAt);
};

const chatWithSupportAssistant = async (req, res) => {
  if (!req.user || req.user.role !== 'ngo') {
    return res.status(403).json({
      success: false,
      message: 'Only NGO accounts can use the support assistant'
    });
  }

  const { messages } = req.body || {};
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_HISTORY_LENGTH ||
    messages.some((message) =>
      !message ||
      !['user', 'model'].includes(message.role) ||
      typeof message.text !== 'string' ||
      message.text.trim().length === 0 ||
      message.text.length > MAX_MESSAGE_LENGTH
    ) ||
    messages[0]?.role !== 'user' ||
    messages.some((message, index) =>
      index > 0 && message.role === messages[index - 1].role
    ) ||
    messages[messages.length - 1].role !== 'user'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Send a valid support message and conversation history'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      message: 'The AI support assistant is not configured. Add GEMINI_API_KEY to the backend environment.'
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  );

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: [
              'You are MealMitra Support, a helpful assistant for registered nonprofit organizations (NGOs) using the MealMitra food donation platform.',
              'Answer clearly and kindly. Focus on using the NGO dashboard, finding and accepting available donations, collection status, organization profiles, food preferences, capacity, and common food donation coordination questions.',
              'Do not claim to access or change the user account, donations, or platform data. Explain the steps the user can take instead.',
              'Do not ask for passwords, authentication tokens, or sensitive personal information.',
              'If you do not know a MealMitra-specific answer, say so and suggest contacting MealMitra support. For topics unrelated to MealMitra or donation coordination, briefly redirect the user.'
            ].join(' ')
          }]
        },
        contents: messages.map(({ role, text }) => ({
          role,
          parts: [{ text: text.trim() }]
        })),
        generationConfig: {
          temperature: 1,
          thinkingConfig: {
            thinkingLevel: 'low'
          },
          maxOutputTokens: 256
        }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      const errorReason = result.error?.details?.find(
        (detail) => detail['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo'
      )?.reason;

      console.error(
        'Gemini support request failed:',
        response.status,
        result.error?.status || errorReason || 'unknown error',
        result.error?.message || 'No error message returned'
      );

      if (errorReason === 'API_KEY_INVALID') {
        return res.status(503).json({
          success: false,
          message: 'The Gemini API key was rejected. Create a valid key in Google AI Studio, update GEMINI_API_KEY in backend/.env, and restart the backend.'
        });
      }

      if (
        response.status === 429 ||
        result.error?.status === 'RESOURCE_EXHAUSTED'
      ) {

        const retryDelayMs = getRetryDelayMs(result.error);
        const retryAt = retryDelayMs === null
          ? null
          : new Date(Date.now() + retryDelayMs);
        const resetTimeText = retryAt
          ? ` Gemini estimates the quota will reset at ${formatQuotaResetTime(retryAt)} (${process.env.APP_TIME_ZONE || 'Asia/Kolkata'}).`
          : '';

        return res.status(429).json({
          success: false,
          message: `The AI assistant has reached its Gemini request quota or rate limit. Wait for the limit to reset, or check your Google AI Studio usage and plan before trying again.${resetTimeText}`,
          retryAt: retryAt?.toISOString() || null
        });
      }

      if (response.status === 503 || result.error?.status === 'UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: 'Gemini is temporarily experiencing high demand. Wait a few minutes, then try sending your message again.'
        });
      }

      return res.status(502).json({
        success: false,
        message: 'The AI assistant could not respond right now. Please try again.'
      });
    }

    const answer = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!answer) {
      return res.status(502).json({
        success: false,
        message: 'The AI assistant could not generate a reply. Please rephrase your question and try again.'
      });
    }

    return res.status(200).json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('Gemini support request error:', error.message);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'The AI assistant took too long to respond. Please try again.'
      });
    }

    return res.status(502).json({
      success: false,
      message: 'The AI assistant could not connect right now. Please try again.'
    });
  }
};

module.exports = {
  chatWithSupportAssistant
};
