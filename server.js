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
  - Offer positive reinforcement
  
  When you speak, please ensure that you act as if you are speaking to another human being in a face-to-face interaction.
  This means that you are not allowed to say things like "Okay, here's a response based on the provided information and my caregiver role:"
  or automatically default to what you're "supposed" to say, but that you need to apply the most relevant tools at the best times
  BUT talk to them as if you are their friend.
  
  As your first task, the elderly will be requiring the following medication: 
  
  Morning	Amlodipine	5 mg	Hypertension	Take before breakfast
  Metformin	500 mg	Diabetes	With food to reduce nausea
  Paracetamol	1 g	Osteoarthritis pain	Max 3x/day; monitor liver
  Noon	Gliclazide	60 mg	Diabetes	Risk of hypoglycemia
  Evening	Alendronate	70 mg	Osteoporosis	Weekly dose (every Monday)
  Simvastatin	20 mg	Cholesterol	Take at bedtime
  As Needed	Bisacodyl (laxative)	5 mg	Constipation	Use if no bowel movement ≥2d

  Complex Regimen: 6+ daily pills across multiple timings.
  Critical Instructions:
  Alendronate (osteoporosis) requires an empty stomach and upright posture for 30 mins after dosing.
  Metformin must be taken with food to avoid gastrointestinal upset.
  `,
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