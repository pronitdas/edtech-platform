import React, { useState } from "react";
import useAuthState from "@/hooks/useAuth";
import { OpenAIClient } from "@/services/openAi";

const Chatbot = ({ topic, language }) => {
    const [userResponse, setUserResponse] = useState("");
    const { oAiKey } = useAuthState()
    const [apiClient, setApiClient] = useState(null)
    const [mentorText, setMentorText] = useState(
        "Hello, I'm AI-Mentor! Let's start your journey. I am aware that you have worked through courses for Physics, Geography ,History and english grammer"
    );
    if (!apiClient && oAiKey) {
        console.log(oAiKey)
        setApiClient(new OpenAIClient(oAiKey))
    }

    const handleNext = async () => {
        if (!userResponse.trim()) {
            alert("Please provide your response.");
            return;
        }
        const params = {

        }
        const mentorText = await apiClient.c(userResponse
            , `Make me understand this topic, answer my doubts, clarify assumptions, dont dump all the information directly, ask me what i want to know, encourage me to ask precise questions, help me drive towards correct path in :${topic} in this ${language} in less than 100 words`, 300)
        setMentorText(
            mentorText
        );
        setUserResponse("");
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">

            <div className="space-y-2 flex flex-col">

                <div style={{ height: "300px" }} className="bg-yellow-200 p-3 rounded-lg scrollbar-thin overflow-y-scroll">
                    <p className="text-gray-800 whitespace-normal text-sm	">{mentorText}</p>
                </div>

                <textarea
                    className="w-full p-2 text-black border rounded-md"
                    rows="3"
                    placeholder="Type your response here..."
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                ></textarea>

                <button
                    className="w-full justify-end py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={handleNext}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
