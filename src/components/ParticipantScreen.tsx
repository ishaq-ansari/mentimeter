import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { supabase } from '../supabase';

interface Question {
  id: string;
  text: string;
  type: 'wordcloud' | 'voting';
  options?: string[];
}

export function ParticipantScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

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

  const handleSubmit = async () => {
    if (!currentQuestion || !sessionId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = currentQuestion.type === 'wordcloud' ? input.trim() : selectedOption;
      if (!response) return;

      const { error } = await supabase
        .from('responses')
        .insert([
          {
            session_id: sessionId,
            question_id: currentQuestion.id,
            response
          }
        ]);

      if (error) throw error;

      setInput('');
      setSelectedOption(null);
    } catch (err) {
      console.error('Error submitting response:', err);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

        {currentQuestion.type === 'wordcloud' ? (
          <div className="space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your word..."
              className="w-full p-2 border rounded-md"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isSubmitting}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={20} />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
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