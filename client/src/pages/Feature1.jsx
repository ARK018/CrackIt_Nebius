import React from "react";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";

// Import Shadcn dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const Feature1 = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userSession"))
  );

  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInterview, setNewInterview] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
  });

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setIsLoading(true);

        // Replace with your actual database and collection IDs
        const response = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COLLECTION_ID,
          [
            Query.equal("userId", user.$id), // Filter by the current user ID if needed
            Query.orderDesc("$createdAt"),
          ]
        );

        setInterviews(response.documents);
        console.log("Interviews fetched:", response.documents);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, [user.id]);

  const handleNewInterview = () => {
    setIsDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInterview({
      ...newInterview,
      [name]: value,
    });
  };

  const handleCreateInterview = () => {
    // Validate title field
    if (!newInterview.title.trim()) {
      setErrors({
        ...errors,
        title: "Job title cannot be empty",
      });
      return; // Prevent submission
    }

    setLoading(true);

    axios
      .post("http://localhost:5000/interview-inputs", newInterview)
      .then((response) => {
        console.log("New interview created:", response.data);
        navigate("/dashboard/interview", {
          state: {
            interview: newInterview,
          },
        });
      })
      .catch((error) => {
        console.error("Error creating interview:", error);
        setLoading(false);
      });
  };

  const handleInterviewClick = (interview) => {
    let parsedConversation = [];
    let parsedAssessment = null;

    try {
      // Safely parse conversation data
      if (interview.conversation) {
        parsedConversation = JSON.parse(interview.conversation);
      }

      // Safely parse assessment data
      if (interview.assesment) {
        parsedAssessment = JSON.parse(interview.assesment);
      }
    } catch (error) {
      console.error("Error parsing interview data:", error);
    }

    navigate("/dashboard/assessment", {
      state: {
        assessment: parsedAssessment,
        conversation: parsedConversation || [], // Ensure it's always an array
        interview: interview, // Pass the raw interview object too
      },
    });
  };

  return (
    <div className="w-full bg-white">
      <div className="border-b border-black/10 flex items-center py-7 px-8">
        <h3 className="text-3xl text-gray-700">Welcome, {user.name}</h3>
      </div>

      <div className="w-full flex flex-col gap-4 px-8 pt-10">
        <h2 className="text-xl font-medium text-gray-800">My Plans</h2>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* new interview card */}
          <div
            onClick={handleNewInterview}
            className="border border-gray-200 rounded-lg bg-white hover:bg-[#f8f8ec] transition-colors cursor-pointer flex items-center justify-center h-[180px]"
          >
            <div className="flex flex-col items-center gap-2">
              <Plus size={20} className="text-gray-400" />
              <p className="text-sm text-gray-500">New Interview</p>
            </div>
          </div>

          {/* Map through interview data */}
          {interviews.map((interview) => (
            <div
              key={interview.$id}
              className="border border-gray-200 rounded-lg bg-white hover:bg-[#f8f8ec] transition-colors cursor-pointer p-4 h-[180px] flex flex-col justify-between"
              onClick={() => handleInterviewClick(interview)}
            >
              <div>
                <h3 className="font-medium text-gray-800">{interview.title}</h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3 overflow-hidden">
                  {(() => {
                    try {
                      return interview.assesment
                        ? JSON.parse(interview.assesment).summary ||
                            "No summary available"
                        : "No assessment available";
                    } catch (error) {
                      console.error("Error parsing assessment:", error);
                      return (
                        interview.description || "No description available"
                      );
                    }
                  })()}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {interview.$createdAt
                  ? new Date(interview.$createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "No date specified"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Interview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medium">
              Create New Interview Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Job Title
              </Label>
              <input
                id="title"
                name="title"
                value={newInterview.title}
                onChange={handleInputChange}
                placeholder="Frontend Developer"
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-colors"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </Label>
              <textarea
                id="description"
                name="description"
                value={newInterview.description}
                onChange={handleInputChange}
                placeholder="Interview details, company information, position requirements..."
                className="w-full min-h-[120px] resize-y px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-colors"
                rows={5}
              />
            </div>
            {/* Date field removed */}
          </div>
          <DialogFooter className="pt-2">
            <button
              type="submit"
              className="w-full px-6 py-2 text-sm font-normal rounded-md text-black bg-[#c4e456] flex items-center justify-center cursor-pointer"
              onClick={handleCreateInterview}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                  Generating...
                </>
              ) : (
                "Create Plan"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feature1;
