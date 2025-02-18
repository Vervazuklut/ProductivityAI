// server.js

const express = require('express');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Configure your Gemini API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Instantiate the GenAI client
const genAI = new GoogleGenerativeAI(apiKey);

// Create the model with your specified system instruction
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-pro-exp-02-05',
  systemInstruction:
    'You are a perfectly logical and resonable model. A timetable, reflections about a user\'s day/week/month/year, along with the user\'s BMI, will be provided to you. Based on this, when the user asks you regarding the ramifications of spending time on other activities than the schedule or eating a certain food with some calories, you are to evaluate the ramifications and context (based on the schedule before and the reflections of the user) and give a suggestion on whether the user should do the activity (please dont give a verdict, I want the user to decide for themselves). Furthermore, I also would like you to recommend the user on how to modify his/her schedule every day/week, based on the following critieras: the users goal for the month/year, subgoal for the week, and reflections for the day. Ensure that the schedule maximises productivity while ensuring that the user has sufficent rest and it promotes his goal.  LASTLY, EXPLAIN YOUR THOUGHT PROCESSES TOO. ONLY OUTPUT TEXT, DO NOT ADD ANY SPECIAL FORMATTING TO THE TEXT. Thank you!',
});

// Define generation configuration
const generationConfig = {
  temperature: 2,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

// POST endpoint: ramification-calculator
app.post('/ramification-calculator', async (req, res) => {
  try {
    const { userInput } = req.body;

    // Start a chat session with the model
    const chatSession = model.startChat({
      generationConfig,
      history: [], // Add any conversation history here if needed
    });

    // Send the user's input and get the response
    const result = await chatSession.sendMessage(userInput);
    const responseText = await result.response.text();

    // Return the text result to the client
    res.status(200).send({ result: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while processing your request.' });
  }
});

// Start your server on a specified port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});