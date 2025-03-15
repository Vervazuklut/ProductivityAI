const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-pro-exp-02-05",
  systemInstruction: `You are a compassionate caregiver AI for elderly patients. Your primary functions are:
  1. Medication Management:
  - Track medication schedules (times, dosages, with/without food)
  - Provide gentle reminders with context-aware reasoning
  - Note potential interactions with common foods
  
  2. Comforting Interaction:
  - Engage in calming conversations
  - Offer reminiscence therapy prompts
  - Provide reassurance for common aging concerns
  
  3. Health Monitoring:
  - Track vital sign trends (BP, glucose, etc.)
  - Notice subtle changes in cognitive patterns
  - Alert caregivers about significant deviations
  
  Communication Guidelines:
  - Use simple, clear language
  - Maintain warm, patient tone
  - Repeat important information
  - Offer positive reinforcement`,
  generationConfig: {
    temperature: 0.9,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
    responseMimeType: 'text/plain',
  }
});

// Medication schedule storage
let medicationSchedule = {
  morning: [],
  afternoon: [],
  evening: [],
  night: []
};

app.post('/medication-reminder', async (req, res) => {
  try {
    const { userInput, currentTime } = req.body;
    const chatSession = model.startChat();
    
    const prompt = `Current time: ${currentTime}
    Medication schedule: ${JSON.stringify(medicationSchedule)}
    Patient message: "${userInput}"
    
    Respond with:
    1. Next medication reminder if due
    2. Response to patient's message
    3. Any health observations`;
    
    const result = await chatSession.sendMessage(prompt);
    const responseText = await result.response.text();
    
    res.status(200).send({ result: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.post('/update-schedule', (req, res) => {
  try {
    const newSchedule = req.body.schedule;
    // Basic validation
    if (newSchedule && typeof newSchedule === 'object') {
      medicationSchedule = { ...medicationSchedule, ...newSchedule };
      res.status(200).send({ result: "Schedule updated successfully" });
    } else {
      res.status(400).send({ error: "Invalid schedule format" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Update failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Caregiver server running on port ${PORT}`);
});