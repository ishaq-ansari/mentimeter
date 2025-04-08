import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';

interface Question {
  id: string;
  text: string;
  type: 'wordcloud' | 'voting';
  options?: string[];
  maxResponses?: number;
}

export function ParticipantScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [inputs, setInputs] = useState<string[]>(['']);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [hasSubmittedMax, setHasSubmittedMax] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId && currentQuestion?.id) {
      // Check how many times user has submitted for this question
      const submittedCountKey = `submitted_count_${sessionId}_${currentQuestion.id}`;
      const count = parseInt(localStorage.getItem(submittedCountKey) || '0');
      setSubmissionCount(count);
      
      // Check if user has reached max submissions
      const maxReached = currentQuestion.maxResponses ? count >= currentQuestion.maxResponses : count > 0;
      setHasSubmittedMax(maxReached);
      
      // Reset inputs
      setInputs(['']);
    }
  }, [sessionId, currentQuestion?.id]);

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('questions')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Session not found');

      setQuestions(data.questions);
      setCurrentQuestion(data.questions[0]);
      setError(null);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Session not found');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const addInputField = () => {
    if (inputs.length < (currentQuestion?.maxResponses || 1)) {
      setInputs([...inputs, '']);
    }
  };

  const removeInputField = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !sessionId || isSubmitting || hasSubmittedMax) return;

    setIsSubmitting(true);
    try {
      if (currentQuestion.type === 'wordcloud') {
        // Filter out empty inputs
        const validInputs = inputs.filter(input => input.trim() !== '');
        if (validInputs.length === 0) return;

        // Insert all responses
        const responsesData = validInputs.map(input => ({
          session_id: sessionId,
          question_id: currentQuestion.id,
          response: input.trim()
        }));

        const { error } = await supabase.from('responses').insert(responsesData);
        if (error) throw error;

        // Update submission count in localStorage
        const submittedCountKey = `submitted_count_${sessionId}_${currentQuestion.id}`;
        const newCount = submissionCount + validInputs.length;
        localStorage.setItem(submittedCountKey, newCount.toString());
        
        setSubmissionCount(newCount);
        
        // Check if max submissions reached
        const maxReached = currentQuestion.maxResponses 
          ? newCount >= currentQuestion.maxResponses 
          : true;
          
        setHasSubmittedMax(maxReached);
      } else {
        // Voting question logic (one response only)
        if (!selectedOption) return;

        const { error } = await supabase
          .from('responses')
          .insert([{
            session_id: sessionId,
            question_id: currentQuestion.id,
            response: selectedOption
          }]);

        if (error) throw error;
        
        // Mark as submitted in localStorage
        const submittedCountKey = `submitted_count_${sessionId}_${currentQuestion.id}`;
        localStorage.setItem(submittedCountKey, '1');
        setSubmissionCount(1);
        setHasSubmittedMax(true);
      }

      setInputs(['']);
      setSelectedOption(null);
    } catch (err) {
      console.error('Error submitting response:', err);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableResponses = () => {
    if (!currentQuestion?.maxResponses) return 0;
    return Math.max(0, currentQuestion.maxResponses - submissionCount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">{error}</h2>
          <p className="text-gray-600">Please check the session ID and try again.</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-bold mb-4">{currentQuestion.text}</h1>

        {hasSubmittedMax && currentQuestion.type === 'voting' ? (
          <div className="flex flex-col items-center justify-center py-8 text-green-600">
            <CheckCircle size={48} />
            <p className="mt-4 text-lg font-medium">Thank you! Your response has been submitted.</p>
          </div>
        ) : currentQuestion.type === 'wordcloud' ? (
          <div className="space-y-4">
            {hasSubmittedMax ? (
              <div className="flex flex-col items-center justify-center py-8 text-green-600">
                <CheckCircle size={48} />
                <p className="mt-4 text-lg font-medium">
                  Thank you! You've submitted all {currentQuestion.maxResponses || 1} responses.
                </p>
              </div>
            ) : (
              <>
                {currentQuestion.maxResponses && currentQuestion.maxResponses > 1 && (
                  <div className="text-sm text-gray-600 mb-2">
                    Responses remaining: {getAvailableResponses()} of {currentQuestion.maxResponses}
                  </div>
                )}
                
                {inputs.map((input, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      placeholder="Enter your word..."
                      className="flex-1 p-2 border rounded-md"
                    />
                    {inputs.length > 1 && (
                      <button
                        onClick={() => removeInputField(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                        aria-label="Remove field"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}

                {inputs.length < (currentQuestion.maxResponses || 1) && (
                  <button
                    onClick={addInputField}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                  >
                    <Plus size={16} /> Add another response
                  </button>
                )}
                
                <button
                  onClick={handleSubmit}
                  disabled={inputs.every(input => !input.trim()) || isSubmitting}
                  className="w-full mt-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={20} />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(option)}
                className={`w-full p-4 rounded-lg text-left ${
                  selectedOption === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
            {selectedOption && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={20} />
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}