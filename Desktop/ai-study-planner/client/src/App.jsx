import React, { useState, useCallback } from "react";
import { BookOpen, Loader2, Zap, AlertTriangle } from "lucide-react";
import './App.css'

// Helper Component for a single scheduled item in the plan
const ScheduleItem = ({ day, topic, duration, index }) => {
  // Define colors for visual distinction, cycling through a few options
  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-emerald-100 text-emerald-800",
    "bg-indigo-100 text-indigo-800",
    "bg-orange-100 text-orange-800",
  ];

  const colorClass = colors[index % colors.length];

  return (
    <div className={`flex items-start p-4 mb-3 rounded-lg shadow-sm border border-gray-200 ${colorClass}`}>
      <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white text-lg font-bold mr-4">
        {index + 1}
      </div>
      <div className="grow">
        <h3 className="font-semibold text-lg leading-tight">{topic}</h3>
        <p className="text-sm opacity-90 mt-1">
          <span className="font-medium">{day}:</span> {duration}
        </p>
      </div>
    </div>
  );
};

// Component to display the successfully generated plan
const PlanOutput = ({ plan }) => {
  if (!plan) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl h-full">
      {/* Plan Title and Summary */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {plan.planTitle}
        </h2>
        <p className="text-gray-600 italic leading-snug">{plan.summary}</p>
      </div>

      {/* Weekly Schedule Section */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Zap className="w-5 h-5 mr-2 text-yellow-500" />
        Weekly Schedule
      </h3>
      
      <div className="overflow-y-auto max-h-[60vh]">
        {plan.schedule.map((item, index) => (
          <ScheduleItem key={index} {...item} index={index} />
        ))}
      </div>
    </div>
  );
};

// Main Application Component
export default function App() {
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [timeSlots, setTimeSlots] = useState("");
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoized function to handle the API request
  const handleGenerate = useCallback(async () => {
    if (!goal || !duration || !timeSlots) {
      setError("Please fill in all fields to generate the study plan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null); // Clear previous plan

    try {
      const response = await fetch("http://localhost:3001/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal, duration, timeSlots }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        // Handle HTTP errors or errors returned by the backend (500 status, etc.)
        throw new Error(data.error || "Could not connect to the AI service.");
      }

      // Check for successful data and set the plan
      if (data.plan && data.plan.schedule) {
        setPlan(data.plan);
      } else {
         // This catches cases where the AI might return unexpected JSON structure
        throw new Error("AI returned an invalid plan structure. Try refining your goal.");
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
      setError("Failed to connect to the Node.js server or API. Please ensure your backend is running on port 3001.");
    } finally {
      setIsLoading(false);
    }
  }, [goal, duration, timeSlots]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      
      {/* Header Section */}
      <header className="text-center mb-10 pt-4 pb-4">
        <div className="flex items-center justify-center text-4xl font-extrabold text-gray-800 mb-2">
          <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
          AI Study Plan Coach
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Generate a structured, actionable study plan powered by AI to achieve your learning objectives efficiently.
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Card */}
        <div className="bg-white p-6 rounded-xl shadow-2xl border-t-4 border-blue-600 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Describe your learning goal</h2>
          
          {/* Form Input Fields */}
          <div className="space-y-6 grow">
            <label className="block">
              <span className="text-gray-700 font-medium mb-1 block">Goal Details</span>
              <textarea
                className="w-full text-blue-600 border border-gray-300 rounded-lg p-3 resize-none focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                rows="6"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Master Python for data science, including libraries like Pandas and Matplotlib."
                aria-label="Learning Goal"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-gray-700 font-medium mb-1 block">Total study duration</span>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 4 weeks"
                  aria-label="Total Study Duration"
                />
              </label>

              <label className="block">
                <span className="text-gray-700 font-medium mb-1 block">Your available time slots</span>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                  value={timeSlots}
                  onChange={(e) => setTimeSlots(e.target.value)}
                  placeholder="e.g., Mon, Wed, Fri evenings (2 hours each)"
                  aria-label="Available Time Slots"
                />
              </label>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={`mt-6 w-full py-3 rounded-lg text-white font-semibold transition duration-300 flex items-center justify-center ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-900 hover:bg-blue-800 shadow-xl"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Goals...
              </>
            ) : (
              "Generate Plan"
            )}
          </button>
        </div>

        {/* Output Card - Renders only when a plan is available */}
        {plan ? (
          <PlanOutput plan={plan} />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-2xl h-full flex items-center justify-center">
            <p className="text-gray-500 italic">Enter your details and click 'Generate Plan' to see your personalized schedule here.</p>
          </div>
        )}
      </div>

      <footer className="text-center mt-12 text-sm text-gray-500">
          <p>Built with React, Node.js/Express, and the Gemini API.</p>
      </footer>
    </div>
  );
}
