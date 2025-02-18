// server.js

const express = require('express');
const {
  GoogleGenerativeAI,
} = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Configure your Gemini API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Instantiate the GenAI client
const genAI = new GoogleGenerativeAI(apiKey);

// Create the model with your specified system instruction
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-pro-exp-02-05",
    systemInstruction: "You are a perfectly logical and resonable model. A timetable, reflections about a user's day/week/month/year, along with the user's BMI, will be provided to you. Based on this, you will be asked to respond in the following modes, labelled from mode 1 to mode 3: \n\nMode 1: when the user asks you regarding the ramifications of or eating a certain food with some calories, you are to evaluate the ramifications and context (Only the BMI will be provided to you in this mode. Based on the BMI and much more, such as cost) and give a suggestion on whether the user should eat (please dont give a verdict, I want the user to decide for themselves.). \n\nMode 2: When the user asks you regarding the ramifications spending time on other activities than the schedule, you are to evaluate the ramifications and context (Based on the schedule before and the reflections of the user) and give a suggestion on whether the user should do the activity (please dont give a verdict, I want the user to decide for themselves). \n\nMode 3: Furthermore, I also would like you to recommend the user on how to modify his/her schedule every day/week, based on the following critieras: the users goal for the month/year, subgoal for the week, and reflections for the day. Ensure that the schedule maximises productivity while ensuring that the user has sufficent rest and it promotes his goal.  \n\nLASTLY, EXPLAIN YOUR THOUGHT PROCESSES TOO. ONLY OUTPUT TEXT, DO NOT ADD ANY SPECIAL FORMATTING TO THE TEXT. Thank you!",
  });
const planner = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "You are an AI assistant specialized in task management and planning. Your role is to take a list of tasks provided by the user, summarize them, and break them down into clear, actionable microtasks for the following day. Ensure the microtasks are specific, achievable, and ordered logically for efficient completion. If any task lacks clarity, infer reasonable details based on context. Present the output in a structured format, prioritizing clarity and brevity.",
});
// Define generation configuration
const generationConfig = {
  temperature: 2,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};
let conversationHistory = [];

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

app.post('/task-manager', async (req, res) => {
try {
    const { userInput } = req.body;

    // Start a chat session and pass along existing history
    const chatSession = planner.startChat({
    generationConfig,
    history: conversationHistory,
    });

    // Send the user's input and get the response
    const result = await chatSession.sendMessage(userInput);
    const responseText = await result.response.text();

    // Update the conversation history with the latest user input and AI response
    conversationHistory.push({ role: 'user', content: userInput });
    conversationHistory.push({ role: 'assistant', content: responseText });

    // Return the response
    res.status(200).send({ result: responseText });
} catch (error) {
    console.error(error);
    res
    .status(500)
    .send({ error: 'An error occurred while processing your request.' });
}
});

// Start your server on a specified port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});