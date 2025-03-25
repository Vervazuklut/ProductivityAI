const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Updated natural language style with gentle Singaporean flavor
const systemInstruction = `You are Ah Mei, a digital nursing assistant created by Singapore's HealthTech initiative. 
Your personality combines a patient nurse's professionalism with a granddaughter's warmth. 

Key traits:
1. Medication Expert:
- Explain medical terms simply (say "milligrams" not "mg")
- Mention food interactions using local dishes
- Give 1 gentle reminder per medication cycle

2. Compassionate Companion:
- Prioritize emotional needs over schedules
- Initiate reminiscence through Singapore's history
- Use occasional Singlish phrases naturally (e.g., "lah", "ah")

3. Health Guardian:
- Notice unspoken needs through conversation
- Escalate urgent issues with family approval

Backstory: "I'm your ang moh-chinese AI hybrid lah! Created at NTU but trained by real nurses. 
Can help with medicines but better at kopi-making stories!"`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-pro-exp-02-05",
  systemInstruction: systemInstruction,
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 512,
    responseMimeType: 'text/plain',
  }
});

// Enhanced medication tracking
let medicationSchedule = {
  morning: [
    { 
      name: 'Amlodipine', 
      dosage: '5 milligrams', 
      instructions: 'Before breakfast',
      lastReminded: null,
      acknowledged: false
    }
  ],
  evening: [
    {
      name: 'Simvastatin',
      dosage: '20 milligrams',
      instructions: 'At bedtime',
      lastReminded: null,
      acknowledged: false
    }
  ]
};

// Conversation history with context tracking
let chatContext = {
  lastMedicationReminder: null,
  pendingMedications: [],
  currentFocus: 'general' // 'medication' | 'emotional' | 'health'
};

app.post('/medication-reminder', async (req, res) => {
  try {
    const { userInput, currentTime } = req.body;
    
    // Build context-aware prompt
    const prompt = `
      Patient: ${userInput}
      Current Time: ${currentTime}
      Context: ${JSON.stringify(chatContext)}
      
      Guidelines:
      1. ${chatContext.pendingMedications.length > 0 ? 'Confirm medication taken FIRST' : 'Prioritize emotional needs'}
      2. Use natural Singapore English ("Take your medicine first, can?" not forced Singlish)
      3. Explain dosages clearly ("five milligrams" not "5mg")
      4. Mention local equivalents ("avoid kopi-o, take with teh-c instead")
      
      Respond format:
      <if medication needed>
      Reminder: [medication details]
      Message: [brief confirmation]
      <else>
      Message: [focused on patient's emotional needs]
    `;

    const chatSession = model.startChat();
    const result = await chatSession.sendMessage(prompt);
    const responseText = await result.response.text();

    // Update context state
    if(responseText.includes('Reminder:')) {
      chatContext.pendingMedications = medicationSchedule.morning
        .filter(med => !med.acknowledged)
        .map(med => med.name);
    } else {
      chatContext.pendingMedications = [];
      chatContext.currentFocus = 'emotional';
    }

    res.status(200).send({ result: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server issue lah, try again later okay?' });
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