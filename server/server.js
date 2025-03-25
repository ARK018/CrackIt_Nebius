require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const { transcribeAudio, getAIResponse, textToSpeech } = require("./Interview");
const OpenAI = require("openai");

// OpenAI client initialization
const client = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

let interview = null;

app.get("/test", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.post("/interview-inputs", (req, res) => {
  try {
    interview = req.body;
    console.log(interview);
    res.json("New interview created");
  } catch (error) {
    console.error(error);
  }
});

app.post("/interview-assesment", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    const response = await client.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-fast",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are an AI assesment generator conducting an assesment for the role of ${data.title}.
          Your primary objective is to assess the candidate based on the following conversation history: ${data.conversation}.
          Here's the job description for reference: ${data.description}.
          You will provide your response in JSON format as shown below:
          {
            overallScore: (0 to 100),
            categories: [
              { name: "Technical Knowledge", score: (0 to 100) },
              { name: "Communication Skills", score: (0 to 100) },
              { name: "Problem Solving", score: (0 to 100) },
              { name: "Cultural Fit", score: (0 to 100) },
            ],
            strengths: [
              (2 to 3 strengths)
            ],
            improvements: [
              (2 to 3 improvements)
            ],
            summary: (detailed summary of the assesment)
          }
          
          ### Rule :
          1. Give the response in the JSON format as shown above.
          2. Give low marks for irrelevant, off-topic, or inappropriate responses.
          3. Provide scores for each category based on the candidate's responses.
          `,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    // Extract and parse the JSON content from response
    try {
      const content = response.choices[0].message.content;
      const assessmentData = JSON.parse(content);
      res.json(assessmentData); // Send just the parsed data
    } catch (error) {
      console.error("Error parsing AI response:", error);
      res.json(response); // Fallback to sending the whole response
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const conversations = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Initialize conversation history for this client
  conversations.set(socket.id, []);

  socket.on("speech-data", async (audioBuffer) => {
    try {
      // Step 1: Transcribe audio to text
      const transcription = await transcribeAudio(audioBuffer);
      if (!transcription || transcription.trim() === "") {
        socket.emit("error", {
          message: "Could not transcribe audio or no speech detected",
        });
        return;
      }

      console.log("Transcription:", transcription);

      // Send the transcription to the client
      socket.emit("transcription", transcription);

      // Update conversation history with user message
      const history = conversations.get(socket.id) || [];
      history.push({ role: "user", content: transcription });

      // Step 2: Get AI response
      const aiResponse = await getAIResponse(transcription, history, interview);

      // Update conversation history with AI response
      history.push({ role: "assistant", content: aiResponse });
      conversations.set(socket.id, history);

      // Send text response to client
      socket.emit("ai-response-text", aiResponse);

      // Step 3: Convert AI response to speech in parallel with sending text
      textToSpeech(aiResponse, socket);
    } catch (error) {
      console.error("Error processing speech:", error);
      socket.emit("error", { message: "Error processing your speech" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Clean up conversation history
    conversations.delete(socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
