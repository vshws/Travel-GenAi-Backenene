require('dotenv').config();
const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
const port = 5000;

app.use(bodyParser.json());

// Initialize GoogleGenerativeAI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Function to generate hotel recommendations
const generateHotels = () => {
    return {
        normal: "Hotel XYZ",
        middle_class: "Hotel ABC",
        rich: "Luxury Hotel Chennai"
    };
};

app.post('/generate-itinerary', async (req, res) => {
    const { destination, days } = req.body;

    if (!destination || !days) {
        return res.status(400).json({ error: 'Destination and number of days are required.' });
    }

    const prompt = `
    Generate a travel itinerary for ${days} days in ${destination}. 
    Provide the details in the following JSON format:
    {
        "destination": "${destination}",
        "days": ${days},
        "itinerary": [
            {
                "day": 1,
                "activities": ["Activity 1", "Activity 2", "Activity 3"]
            },
            {
                "day": 2,
                "activities": ["Activity 1", "Activity 2", "Activity 3"]
            }
            // Continue for each day
        ]
    }`;

    try {
        const result = await model.generateContent(prompt);

        const rawText = result.response.text();
        console.log('Raw response:', rawText);

        // Extract JSON part from the response
        const jsonMatch = rawText.match(/\{.*\}/s);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in the response.');
        }

        const cleanText = jsonMatch[0];

        try {
            const jsonResponse = JSON.parse(cleanText);

            // Add hotel recommendations to each day in the itinerary
            jsonResponse.itinerary.forEach(day => {
                day.hotels = generateHotels();
            });

            res.json(jsonResponse);
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            res.status(500).json({ error: 'Failed to parse JSON response from the model.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
