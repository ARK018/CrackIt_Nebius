require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("@deepgram/sdk");

const DEEPGRAM_API_KEY =
  process.env.DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GRoQ_API_KEY";
// Store conversation history for each client

// Function to transcribe audio using Groq's Whisper API
async function transcribeAudio(audioBuffer) {
  try {
    const tempFilePath = path.join(__dirname, `temp-${uuidv4()}.webm`);
    fs.writeFileSync(tempFilePath, Buffer.from(audioBuffer));

    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFilePath));
    formData.append("model", "whisper-large-v3");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    console.log("Transcription result:", response.data);
    return response.data.text;
  } catch (error) {
    console.error(
      "Error transcribing audio:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Function to get AI response using Groq's LLama 3.2
async function getAIResponse(message, conversationHistory, interview) {
  try {
    // Format the conversation history for the LLM
    const messages = [
      {
        role: "system",
        content: `You are TESS an AI interviewer conducting an interview for the role of ${interview.title}. 
        Your primary objective is to assess the candidate's (role:'user') qualifications, skills, and experiences strictly related to the ${interview.title} role. 
        Ask only questions that are directly relevant to the job responsibilities, required qualifications, and technical or behavioral competencies necessary for this position. 
        Here's the job description for reference: ${interview.description}.
        
        ### Rule : 
        1. Avoid discussing any unrelated topics, personal details, or opinions outside the context of the job.
        2. Do not repeat the same question or ask for the same information more than once. 
        3. Ensure the conversation remains professional, focused, and efficient. 
        4. Begin by introducing yourself in very short before proceeding to the questions.
        5. Ask questions that are open-ended and encourage the candidate to provide detailed responses.
        6. Do not provide user with any assesment, feedback or additional information.
        7. If the candidate asks for clarification, provide only very short & necessary details to answer the question.
`,
      },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages,
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    console.log("AI response:", response.data);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error getting AI response:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Function to convert text to speech using Deepgram's API
async function textToSpeech(text, socket) {
  try {
    // Create a Deepgram client
    const deepgram = createClient(DEEPGRAM_API_KEY);

    // Improved text splitting - combine into larger meaningful chunks
    // Split first into major sentence breaks
    const rawSentences = text.split(/(?<=[.!?])\s+|(?<=[.!?])$/);
    const sentences = rawSentences
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());

    console.log(
      `Split text into ${sentences.length} chunks for faster TTS processing`
    );

    // Optimize chunks - aim for larger chunks to reduce API calls
    // Target chunk size of 150-250 characters for better performance
    const optimizedChunks = [];
    let currentChunk = "";
    const TARGET_LENGTH = 200;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= TARGET_LENGTH) {
        currentChunk += (currentChunk ? " " : "") + sentence;
      } else {
        if (currentChunk) optimizedChunks.push(currentChunk);
        currentChunk = sentence;
      }
    }
    if (currentChunk) optimizedChunks.push(currentChunk);

    console.log(`Optimized into ${optimizedChunks.length} processing chunks`);

    // Track processed chunks to handle completion correctly
    const processedChunks = new Set();
    const totalChunks = optimizedChunks.length;

    // Process chunks sequentially for more predictable performance
    for (let i = 0; i < optimizedChunks.length; i++) {
      const chunk = optimizedChunks[i];
      if (!chunk.trim()) continue;

      console.log(`Processing chunk ${i}: "${chunk.substring(0, 30)}..."`);

      try {
        // Make a request to generate speech
        const response = await deepgram.speak.request(
          { text: chunk },
          {
            model: "aura-asteria-en",
            encoding: "linear16",
            container: "wav",
          }
        );

        // Get the audio stream
        const stream = await response.getStream();
        if (stream) {
          // Convert stream to buffer
          const audioBuffer = await getAudioBuffer(stream);
          console.log(
            `Generated audio for chunk ${i}, buffer size: ${audioBuffer.length} bytes`
          );

          // Send the chunk to the client with its sequence number
          socket.emit("tts-chunk", {
            audio: audioBuffer,
            index: i,
            isLast: false,
          });

          console.log(`Sent TTS chunk ${i + 1}/${totalChunks}`);

          // Track completion
          processedChunks.add(i);

          // Send completion signal when all chunks are done
          if (processedChunks.size === totalChunks) {
            socket.emit("tts-complete");
            console.log("All TTS chunks processed and sent");
          }
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        processedChunks.add(i);
      }
    }
  } catch (error) {
    console.error("Error with text-to-speech:", error);
    socket.emit("tts-error", { message: "Error generating speech" });
  }
}

// Helper function to combine very short sentences to reduce the number of API calls
function combineShortSentences(sentences, minLength = 20) {
  const result = [];
  let currentSentence = "";

  for (const sentence of sentences) {
    // If current accumulated sentence is short, and this sentence is short, combine them
    if (
      (currentSentence.length < minLength || sentence.length < minLength) &&
      currentSentence.length + sentence.length + 1 <= 200
    ) {
      // Don't make them too long
      if (currentSentence) {
        currentSentence += " " + sentence;
      } else {
        currentSentence = sentence;
      }
    } else {
      // If we have accumulated text, add it to results
      if (currentSentence) {
        result.push(currentSentence);
      }
      currentSentence = sentence;
    }
  }

  // Add any remaining text
  if (currentSentence) {
    result.push(currentSentence);
  }

  return result;
}

// Helper function to split text into sentences
function splitIntoSentences(text) {
  // Split on periods, question marks, and exclamation points followed by a space or end of string
  const sentences = text.split(/(?<=[.!?])\s+|(?<=[.!?])$/);

  // Filter out empty sentences and trim whitespace
  return sentences
    .filter((sentence) => sentence.trim().length > 0)
    .map((sentence) => sentence.trim());
}

// Helper function to convert stream to audio buffer - modified for more robustness
const getAudioBuffer = async (stream) => {
  try {
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
      }
    }

    if (chunks.length === 0) {
      console.error("No audio data received in stream");
      return Buffer.alloc(0);
    }

    // Combine all chunks into a single Uint8Array
    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }

    const combinedArray = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      combinedArray.set(chunk, offset);
      offset += chunk.length;
    }

    // Use a regular Buffer for better socket.io compatibility
    return Buffer.from(combinedArray);
  } catch (error) {
    console.error("Error processing audio stream:", error);
    return Buffer.alloc(0); // Return empty buffer on error
  }
};

module.exports = { transcribeAudio, getAIResponse, textToSpeech };
