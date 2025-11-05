import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenAI,Type } from '@google/genai';
const PORT=3001;
const MODEL='gemini-2.5-flash';
const apikey=process.env.GEMINI_API_KEY;
if(!apikey){
    console.error("GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}
const ai= new GoogleGenAI({
    apiKey: apikey
});
const app=express();
app.use(cors(
    {
        origin:'http://localhost:5173',
        methods:['Post'],
        allowedHeaders:['Content-Type']

    }
))
app.use(express.json())
const studyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        planTitle: { type: Type.STRING, description: 'A motivating title for the study plan.' },
        summary: { type: Type.STRING, description: 'A brief, encouraging summary of the plan.' },
        schedule: {
            type: Type.ARRAY,
            description: 'A list of daily schedule entries.',
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: 'The day or date of the week (e.g., "Monday" or "Day 1").' },
                    topic: { type: Type.STRING, description: 'The specific, actionable topic or task to study.' },
                    duration: { type: Type.STRING, description: 'The estimated time needed (e.g., "90 minutes").' }
                },
                required: ['day', 'topic', 'duration']
            }
        },
    },
    required: ['planTitle', 'summary', 'schedule'],
};

app.post("/api/generate-plan",async(req,res)=>{
    const {goal,duration,timeSlots}=req.body
    if (!goal||!duration||!timeSlots){
        return res.status(400).json({ error: "Missing required inputs for goal, duration, or timeSlots." })
    }
    const masterPrompt = `
        You are an expert Academic Coach specializing in creating realistic, effective study plans.
        Goal: ${goal}
        Total Duration: ${duration}
        Available Time Slots/Days: ${timeSlots}
        
        Create a detailed, day-by-day study plan that realistically fits the available time. 
        Each topic must be highly specific and actionable. 
        The schedule must be returned as a JSON object strictly following the provided schema.
    `;
    try{
        const result= await ai.models.generateContent({
            model: MODEL,
            contents:[{role:"user",parts: [{ text: masterPrompt }] }],
            config:{
                responseMimeType: "application/json",
                responseSchema: studyPlanSchema,
            },
        })
        const parsedJson = JSON.parse(result.text.trim());
        res.json({ success: true, plan: parsedJson });


    }catch(error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ error: "Failed to generate study plan from the AI. Check API key validity or model limits." });
    }
})
app.listen(PORT, () => {
    console.log(`Node.js Server listening securely on port ${PORT}.`);
});


