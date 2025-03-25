import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import profile from "../assets/user.png";

const Assessment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [interview, setInterview] = useState({
    title: location.state?.title || "",
    ...(location.state?.interview || {}),
  });

  const [conversation, setConversation] = useState(
    location.state?.conversation || []
  );

  const [assessment, setAssessment] = useState(
    location.state?.assessment || {
      overallScore: 0,
      categories: [],
      strengths: [],
      improvements: [],
      summary: "",
    }
  );

  const messagesContainerRef = useRef(null);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Score color mapping
  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Process response if needed
  useEffect(() => {
    if (location.state?.assessment?.choices) {
      try {
        const content = location.state.assessment.choices[0].message.content;
        // Try to parse the JSON response
        const parsedAssessment = JSON.parse(content);
        setAssessment(parsedAssessment);
      } catch (error) {
        console.error("Error parsing assessment data:", error);
      }
    }
  }, [location.state]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Simple Header */}
      <div className="h-14 border-b flex items-center justify-between px-6">
        <h1 className="text-gray-700 font-medium">
          {interview.title?.toUpperCase() || "INTERVIEW ASSESSMENT"}
        </h1>
        <button
          className="px-6 py-2 text-sm font-normal rounded-md text-black bg-[#c4e456] flex items-center justify-center cursor-pointer"
          onClick={() => navigate("/dashboard/feature1", { replace: true })}
        >
          {" "}
          Back to Dashboard
        </button>
      </div>

      {/* Main content */}
      <div className="flex w-full h-[calc(100vh-56px)] overflow-hidden">
        {/* Left side: Messages area */}
        <div className="flex flex-col w-[40%] border-r">
          <div className="p-3 border-b bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">
              Interview Conversation
            </h2>
          </div>
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4"
          >
            {conversation.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No conversation data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {(msg.role === "ai" || msg.role === "assistant") && (
                      <div className="h-8 w-8 rounded-full bg-blue-100 mr-2 flex-shrink-0">
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-lg max-w-[80%] ${
                        msg.role === "user"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-white border text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="h-8 w-8 rounded-full overflow-hidden ml-2 flex-shrink-0">
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

        {/* Right side: Assessment results */}
        <div className="w-[60%] h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Score section */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 border">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(
                      assessment.overallScore
                    )}`}
                  >
                    {assessment.overallScore}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-800">
                    Overall Score
                  </h2>
                  <p className="text-sm text-gray-500">
                    Based on your interview performance
                  </p>
                </div>
              </div>

              {/* Category scores */}
              <div className="space-y-3 mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Category Scores
                </h3>
                {assessment.categories.map((category, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-40 text-sm text-gray-700">
                      {category.name}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(
                          category.score
                        )} bg-current `}
                        style={{ width: `${category.score}%` }}
                      ></div>
                    </div>
                    <div className="w-10 text-right text-sm font-medium text-gray-700 ml-2">
                      {category.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Summary
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed border-l-2 border-blue-400 pl-3 py-1">
                {assessment.summary}
              </p>
            </div>

            {/* Strengths */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Key Strengths
              </h3>
              <ul className="space-y-1">
                {assessment.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 border-l-2 border-green-400 pl-3 py-1"
                  >
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Areas for Improvement
              </h3>
              <ul className="space-y-1">
                {assessment.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 border-l-2 border-amber-400 pl-3 py-1"
                  >
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
