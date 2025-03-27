import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [videoLink, setVideoLink] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [summary, setSummary] = useState("");
  const [pageState, setPageState] = useState("");
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const fetchQuestions = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/extract-transcript/", { "video_link": videoLink });

      if (response.data.questions) {
        setQuestions(response.data.questions);
        setCurrentQuestionIndex(0);
        setFeedback("");
        setSummary("");
        setPageState("quiz");
        setScore(0);
      } else {
        alert("Failed to generate questions. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("An error occurred while generating questions.");
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/extract-summary/", { "video_link": videoLink });
      console.log("Summary API Response:", response.data);
      
      if (response.data.summary || response.data.Summary) {
        setSummary(response.data.summary || response.data.Summary);
        setPageState("summary");
      } else {
        alert("Failed to generate summary. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      alert("An error occurred while generating summary. Please check the console for details.");
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer) {
      setFeedback("Please provide an answer.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/evaluate-answer/", {
        question: "",
        user_answer: userAnswer,
        correct_answer: questions[currentQuestionIndex][1],
      });

      questions[currentQuestionIndex].push(userAnswer);
      const similarity = response.data.feedback;

      if (similarity === 0.85) {
        setFeedback("Correct! Well done.");
        questions[currentQuestionIndex].push("Correct");
        setScore(prevScore => prevScore + 1);
      } else if (similarity > 0.5) {
        setFeedback("Almost there! Keep trying! The correct answer is: " + questions[currentQuestionIndex][1]);
        questions[currentQuestionIndex].push("Almost there");
        setScore(prevScore => prevScore + 1);
      } else {
        setFeedback("Incorrect. The correct answer is: " + questions[currentQuestionIndex][1]);
        questions[currentQuestionIndex].push("Incorrect");
      }
      setAnswered(true);
    } catch (error) {
      console.error("Error validating answer:", error);
      alert("An error occurred while submitting your answer.");
    }
  };

  const nextQuestion = () => {
    setUserAnswer("");
    setFeedback("");
    setAnswered(false);
    setCurrentQuestionIndex(prevIndex => prevIndex + 1);
  };

  function refreshPage() {
    window.location.reload(false);
  }

  return (
    <div className="wrapper">

    <div className="App">
      <header className="App-header">
        <h1>INTELLIGENT VIDEO LEARNING ASSISTANT</h1>
        <div className="input-section">
          <input
            type="text"
            placeholder="Enter YouTube video link"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            />
          <br />
          <button onClick={fetchSummary}>Generate Summary</button>&ensp;
          <button onClick={fetchQuestions}>Generate Quiz</button>&ensp;
          <button onClick={refreshPage}>Clear</button>
        </div>

        {pageState === "" ? (
          <div></div>
        ) : summary === "" ? (
          <div className="quiz-section">
            {currentQuestionIndex < questions.length ? (
              <div>
                <p>
                  <strong>Question {currentQuestionIndex + 1}:</strong>{" "}
                  {questions[currentQuestionIndex][0]}
                </p>
                <input
                  type="text"
                  placeholder="Your answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  />
                <br />
                <button onClick={submitAnswer}>Submit Answer</button>&ensp;
                <button onClick={nextQuestion} disabled={!answered}>Next Question</button>
                {feedback && <p className="feedback">{feedback}</p>}
              </div>
            ) : (
              <div>
                <p>Congratulations! You have completed the quiz.</p>
                <p>
                  <strong>
                    Final Score: {score} / {questions.length} ({((score / questions.length) * 100).toFixed(2)}%)
                  </strong>
                </p>
                <div>
                  <h2 className="text-xl font-bold mb-4">Quiz Summary</h2>
                  <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}>
                    <thead>
                      <tr className="bg-gray-200">
                        <th>S.No.</th>
                        <th>Question</th>
                        <th>Correct Answer</th>
                        <th>User Answer</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((row, index) => (
                        <tr key={index}>
                          <td>{index + 1}.</td>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ whiteSpace: "pre-wrap" }}>
            <strong>Summary:</strong>{" "}
            <p style={{ textAlign: "left" }} dangerouslySetInnerHTML={{ __html: summary.replace(/\\(.?)\\*/g, "<strong>$1</strong>") }}></p>
          </div>
        )}
      </header>
    </div>
        </div>
  );
}

export default App;