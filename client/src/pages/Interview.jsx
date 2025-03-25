import { useState, useEffect, useRef } from "react";
import { account } from "../lib/appwrite";
import { databases } from "../lib/appwrite";
import { useAuth } from "../lib/context/AuthContext";
import { ID } from "appwrite";
import { io } from "socket.io-client";
import axios from "axios";
import {
  Mic,
  MicOff,
  Loader2,
  BrainCircuit,
  Clock,
  Volume2,
} from "lucide-react";
import profile from "../assets/user.png";
import { useLocation, useNavigate } from "react-router-dom";
import { Description } from "@radix-ui/react-dialog";

function Interview() {
  const location = useLocation();
  const [interview, setInterview] = useState(location.state.interview);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAudioQueueProcessing, setIsAudioQueueProcessing] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEndingInterview, setIsEndingInterview] = useState(false); // New state for loading
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  const audioBuffersRef = useRef([]); // For TTS audio chunks
  const audioQueueRef = useRef([]); // Queue for ordered playback
  const currentPlayingIndexRef = useRef(0); // Track current playing chunk
  const timerRef = useRef(null); // Reference to store the timer interval
  const messagesContainerRef = useRef(null);

  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userSession"))
  );

  // Timer functions
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (!timerActive) {
      setTimerActive(true);
    }
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const handleInterviewEnd = async () => {
    stopTimer();
    setIsEndingInterview(true);

    try {
      axios
        .post("http://localhost:5000/interview-assesment", {
          title: interview.title,
          description: interview.description,
          conversation: messages,
        })
        .then(async (response) => {
          console.log("New interview created:", response.data);
          await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_COLLECTION_ID,
            ID.unique(),
            {
              userId: user.$id,
              title: interview.title,
              description: interview.description,
              conversation: JSON.stringify(messages),
              assesment: JSON.stringify(response.data),
            }
          );
          navigate("/dashboard/assessment", {
            state: {
              title: interview.title,
              description: interview.description,
              conversation: messages,
              assessment: response.data,
            },
          });
        })
        .catch((error) => {
          console.error("Error in API call:", error);
          setIsEndingInterview(false); // Reset loading state if there's an API error
        });
    } catch (error) {
      console.error("Error saving interview notes:", error);
      setIsEndingInterview(false); // Reset loading state if there's an error
    }
  };

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive]);

  useEffect(() => {
    // Connect to the backend server
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    // Listen for transcription
    socketRef.current.on("transcription", (transcription) => {
      console.log("Received transcription:", transcription);
      // Update the last user message with the actual transcription
      setMessages((prev) => {
        const newMessages = [...prev];
        // Find and replace the "Processing..." message with actual transcription
        const processingIndex = newMessages.findIndex(
          (msg) =>
            msg.role === "user" && msg.content === "Processing your speech..."
        );

        if (processingIndex !== -1) {
          newMessages[processingIndex] = {
            role: "user",
            content: transcription,
          };
        } else {
          // Just in case, add it if not found
          newMessages.push({ role: "user", content: transcription });
        }
        return newMessages;
      });
    });

    // Listen for AI responses
    socketRef.current.on("ai-response-text", (response) => {
      console.log("Received AI response:", response);
      setMessages((prev) => [...prev, { role: "ai", content: response }]);
    });

    // Handle audio stream from the server
    socketRef.current.on("tts-chunk", (chunkData) => {
      // We're now receiving an object with audio and index
      console.log(`Received audio chunk ${chunkData.index}`);

      try {
        // Extract the audio data
        const audioData = chunkData.audio;

        if (!audioData) {
          console.error(`Chunk ${chunkData.index} has no audio data`);
          return;
        }

        // Store chunks in ordered array
        audioQueueRef.current[chunkData.index] = audioData;

        // Set AI speaking state when we receive any chunk
        setIsAiSpeaking(true);

        // Only start playing if no audio is currently playing AND this is the chunk we're waiting for
        // AND we're not currently processing audio
        if (
          chunkData.index === currentPlayingIndexRef.current &&
          !isAudioPlaying() &&
          !isAudioQueueProcessing
        ) {
          console.log(`Playing chunk ${chunkData.index} immediately`);
          playNextChunk();
        } else {
          console.log(`Queued chunk ${chunkData.index} for later playback`);
        }
      } catch (error) {
        console.error("Error handling audio chunk:", error);
      }
    });

    socketRef.current.on("tts-complete", () => {
      console.log("Received TTS complete signal");

      // If no audio is currently playing, we can reset queue
      // Otherwise, let the onended handler take care of it
      if (!isAudioPlaying() && !isAudioQueueProcessing) {
        console.log("Audio not playing, resetting queue and ending AI speech");
        audioQueueRef.current = [];
        currentPlayingIndexRef.current = 0;
        setIsAiSpeaking(false);

        // Add a small delay before allowing user to speak
        setTimeout(() => {
          if (!isListening && isConnected) {
            startListening();
          }
        }, 500);
      } else {
        console.log(
          "TTS complete but audio still playing, letting playback finish naturally"
        );
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      // Clean up any created object URLs
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  // Function to check if audio is currently playing
  const isAudioPlaying = () => {
    return !audioRef.current.paused;
  };

  // Function to play the next chunk in sequence
  const playNextChunk = () => {
    // If audio is currently playing or we're in the middle of processing, don't start a new chunk
    if (isAudioPlaying() || isAudioQueueProcessing) {
      console.log(
        "Audio already playing or processing, waiting to play next chunk"
      );
      return;
    }

    setIsAudioQueueProcessing(true);

    try {
      const nextIndex = currentPlayingIndexRef.current;
      console.log(`Attempting to play chunk ${nextIndex}`);
      const chunk = audioQueueRef.current[nextIndex];

      if (!chunk) {
        console.log(`No chunk available at index ${nextIndex}`);
        setIsAudioQueueProcessing(false);
        return; // No chunk available yet
      }

      // Clean up previous URL if exists
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      try {
        // Make sure chunk is a Buffer/ArrayBuffer/Uint8Array
        console.log(
          `Chunk type: ${typeof chunk}, isArray: ${Array.isArray(chunk)}`
        );

        // Convert to array buffer if needed
        let audioData = chunk;
        if (
          typeof chunk === "object" &&
          !ArrayBuffer.isView(chunk) &&
          !(chunk instanceof ArrayBuffer)
        ) {
          console.log("Converting object to typed array");
          // If it's an object with buffer data (from socket.io transfer)
          if (chunk.type === "Buffer" && Array.isArray(chunk.data)) {
            audioData = new Uint8Array(chunk.data);
          } else {
            console.error("Unknown chunk format:", chunk);
            currentPlayingIndexRef.current++; // Skip this chunk
            setIsAudioQueueProcessing(false);
            if (currentPlayingIndexRef.current < audioQueueRef.current.length) {
              setTimeout(() => playNextChunk(), 100); // Try next chunk with longer delay
            }
            return;
          }
        }

        // Create and play the audio
        const audioBlob = new Blob([audioData], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current.src = audioUrl;

        console.log(`Playing chunk ${nextIndex}`);
        // Play the audio
        audioRef.current
          .play()
          .then(() => {
            console.log(`Successfully started playing chunk ${nextIndex}`);
            // Increment index for next chunk
            currentPlayingIndexRef.current++;
            setIsAudioQueueProcessing(false);
          })
          .catch((err) => {
            console.error(`Audio playback error for chunk ${nextIndex}:`, err);
            // Skip this chunk if it fails
            currentPlayingIndexRef.current++;
            setIsAudioQueueProcessing(false);
            if (currentPlayingIndexRef.current < audioQueueRef.current.length) {
              setTimeout(() => playNextChunk(), 100); // Try next chunk with longer delay
            }
          });
      } catch (error) {
        console.error(`Error processing chunk ${nextIndex}:`, error);
        // Skip problematic chunk
        currentPlayingIndexRef.current++;
        setIsAudioQueueProcessing(false);
        if (currentPlayingIndexRef.current < audioQueueRef.current.length) {
          setTimeout(() => playNextChunk(), 100); // Try next chunk with longer delay
        }
      }
    } catch (error) {
      console.error(`Unexpected error in playNextChunk:`, error);
      setIsAudioQueueProcessing(false);
      currentPlayingIndexRef.current++;
      setTimeout(() => playNextChunk(), 100);
    }
  };

  // Setup audioRef ended event to play next chunk
  useEffect(() => {
    const handleAudioEnd = () => {
      console.log(
        `Finished playing chunk ${currentPlayingIndexRef.current - 1}`
      );

      // Try to play the next chunk
      if (
        currentPlayingIndexRef.current < audioQueueRef.current.length &&
        audioQueueRef.current[currentPlayingIndexRef.current]
      ) {
        console.log(`Playing next chunk ${currentPlayingIndexRef.current}`);
        setTimeout(() => playNextChunk(), 50); // Small delay for stability
      } else {
        console.log("No more chunks to play or queue is empty");

        // Wait a moment to check if we really have no more chunks
        // (in case chunks are still being received)
        setTimeout(() => {
          if (
            currentPlayingIndexRef.current >= audioQueueRef.current.length ||
            audioQueueRef.current.length === 0
          ) {
            console.log("All chunks played, ending AI speech");
            setIsAiSpeaking(false);

            // Add a delay before auto-resuming listening to prevent cutting off
            setTimeout(() => {
              if (!isListening && isConnected) {
                console.log("Auto-resuming listening after delay");
                startListening();
              }

              // Reset for next interaction
              audioQueueRef.current = [];
              currentPlayingIndexRef.current = 0;
            }, 500); // Half second pause before allowing user to speak
          } else {
            // We've received more chunks during our wait, play the next one
            playNextChunk();
          }
        }, 200);
      }
    };

    if (audioRef.current) {
      audioRef.current.onended = handleAudioEnd;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.onended = null;
      }
    };
  }, [isListening, isConnected]);

  // Add this effect to scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startListening = async () => {
    try {
      // Start the timer if this is the first time clicking the mic button
      if (!timerActive && elapsedTime === 0) {
        startTimer();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Detect silence and automatically send audio
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let silenceStart = Date.now();
      const silenceDelay = 1500; // 1 seconds of silence before stopping

      const checkSilence = () => {
        if (!isListening || isAiSpeaking) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }

        const average = sum / bufferLength;

        if (average < 5) {
          // Very low volume threshold
          if (Date.now() - silenceStart > silenceDelay) {
            stopListeningAndSend();
            return;
          }
        } else {
          silenceStart = Date.now();
        }

        requestAnimationFrame(checkSilence);
      };

      mediaRecorderRef.current.onstart = () => {
        silenceStart = Date.now();
        checkSilence();
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          sendAudioToServer(audioBlob);
        }
      };

      mediaRecorderRef.current.start(100); // Collect 100ms chunks
      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopListeningAndSend = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    // Only send if there's actual content
    if (audioBlob.size > 1000) {
      // Avoid sending tiny audio chunks
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result;
        socketRef.current.emit("speech-data", buffer);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: "Processing your speech..." },
        ]);
      };
      reader.readAsArrayBuffer(audioBlob);
    } else {
      console.log("Audio too short, not sending");
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-start px-8">
        <div className="flex items-center gap-2">
          <div className="text-gray-700 font-medium">
            {interview.title.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div className="flex w-full h-[calc(100vh-56px)] overflow-hidden">
        {/* Messages area */}
        <div className="flex flex-col w-[40%]">
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-8 py-10"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="max-w-md bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-lg text-gray-800">
                    <span className="font-medium">
                      👋 Hi, I'm Tess, your AI interviewer.
                    </span>{" "}
                    <br />
                    Can you briefly introduce yourself?
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <div className="h-10 w-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                        <div className="h-full w-full bg-gradient-to-br from-green-300 via-blue-400 to-purple-600"></div>
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-white border border-gray-200 text-gray-800"
                      } ${
                        msg.content === "Processing your speech..."
                          ? "animate-pulse"
                          : ""
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="h-10 w-10 rounded-full overflow-hidden ml-3 flex-shrink-0">
                        <img
                          src={profile}
                          alt="User"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Profile info */}
        <div className="w-[70%] h-full flex flex-col justify-between border-l border-gray-200">
          <div className="flex flex-col justify-center items-center h-full">
            <div className="flex justify-center items-center gap-64">
              {/* AI Profile */}
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-4">
                  <div
                    className={`w-full h-full rounded-full bg-gradient-to-br from-green-300 via-blue-400 to-purple-600 transition-all duration-300 ${
                      isAiSpeaking ? "scale-105" : ""
                    }`}
                  ></div>
                  {isAiSpeaking && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-300 via-blue-400 to-purple-600 animate-pulse opacity-70 scale-110"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-300 via-blue-400 to-purple-600 animate-ping opacity-30 scale-125"></div>
                      <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-pulse opacity-70"></div>
                    </>
                  )}
                </div>
                <p className="text-gray-800 text-lg">Tess</p>
              </div>

              {/* User Profile */}
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-4">
                  <div
                    className={`w-full h-full rounded-full overflow-hidden transition-all duration-300 ${
                      isListening ? "scale-105" : ""
                    }`}
                  >
                    <img
                      src={profile}
                      alt="User profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {isListening && (
                    <>
                      <div className="absolute -inset-1 rounded-full border-3 border-red-500 animate-pulse opacity-80 z-10"></div>
                      <div className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping opacity-70 z-10"></div>
                      <div className="absolute -inset-1 rounded-full border-2 border-red-300 animate-ping opacity-50 z-10"></div>
                    </>
                  )}
                </div>
                <p className="text-gray-800 text-lg">{user.name}</p>
              </div>
            </div>
            <div
              className="mt-24 px-4 py-2 text-black/60 border border-black/10 rounded-full
            "
            >
              Click the mic button to stop recording your voice each time.
            </div>
          </div>

          {/* Bottom bar */}
          <div className="h-16 border-t border-gray-200 flex items-center px-8 justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500 text-sm">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={isListening ? stopListeningAndSend : startListening}
                disabled={!isConnected || isAiSpeaking}
                className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-[#abd61b] hover:bg-[#c4e456]"
                } ${
                  !isConnected || isAiSpeaking
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5 text-white" />
                ) : (
                  <Mic className="h-5 w-5 text-black" />
                )}
              </button>
            </div>

            <button
              onClick={handleInterviewEnd}
              disabled={isEndingInterview}
              className={`bg-red-600 text-white px-7 py-2 rounded-full text-sm font-medium ${
                isEndingInterview ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isEndingInterview ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PROCESSING...
                </span>
              ) : (
                "END"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Interview;
