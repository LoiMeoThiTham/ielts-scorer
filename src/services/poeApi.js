import axios from 'axios';

const POE_API_KEY = process.env.REACT_APP_POE_API_KEY;
const POE_BASE_URL = 'https://api.poe.com/v1';

const poeClient = axios.create({
  baseURL: POE_BASE_URL,
  headers: {
    'Authorization': `Bearer ${POE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Score an IELTS essay using the POE API
 * @param {string} essayText - The essay text to score
 * @param {string} topicText - The essay topic/prompt
 * @param {string} taskType - Task type: 'report' or 'essay'
 * @param {string} language - Response language: 'vi' (Vietnamese) or 'en' (English)
 * @returns {Promise<Object>} - The scoring result from AI
 */
export const scoreEssay = async (essayText, topicText, taskType = 'essay', language = 'vi') => {
  try {
    const languageInstruction = language === 'vi'
      ? 'Please provide your response in Vietnamese (Tiếng Việt).'
      : 'Please provide your response in English.';

    const prompt = `You are an IELTS Writing examiner. Please score and evaluate the following ${taskType.toUpperCase()} submission.

${languageInstruction}

Topic/Prompt:
${topicText}

Essay:
${essayText}

Please provide:
1. Overall Band Score (0-9)
2. Scores for each criterion (out of 9):
   - Task Achievement / Task Fulfillment
   - Coherence and Cohesion
   - Lexical Resource
   - Grammatical Range and Accuracy
3. Detailed feedback for each criterion
4. Main strengths
5. Areas for improvement
6. Specific recommendations

Format your response as a structured analysis.`;

    const response = await poeClient.post('/chat/completions', {
      model: 'lumiverse',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return {
      success: true,
      data: response.data.choices[0].message.content,
      raw_response: response.data,
    };
  } catch (error) {
    console.error('POE API Error:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || 'Failed to score essay',
    };
  }
};

/**
 * Get writing tips and suggestions
 * @param {string} essayText - The essay text to analyze
 * @returns {Promise<Object>} - Writing tips and suggestions
 */
export const getWritingTips = async (essayText) => {
  try {
    const response = await poeClient.post('/chat/completions', {
      model: 'lumiverse',
      messages: [
        {
          role: 'user',
          content: `As an IELTS Writing expert, provide 5 specific tips to improve this essay. Focus on vocabulary, grammar, and structure:

Essay:
${essayText}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return {
      success: true,
      data: response.data.choices[0].message.content,
    };
  } catch (error) {
    console.error('POE API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default poeClient;
