import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, PlayCircle } from 'lucide-react';
import { nanoid } from 'nanoid';
import { supabase } from '../supabase';

interface Question {
  id: string;
  text: string;
  type: 'wordcloud' | 'voting';
  options?: string[];
  maxResponses?: number; // New property for word cloud max responses
}

export function CreateSession() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionType, setQuestionType] = useState<'wordcloud' | 'voting'>('voting');
  const [options, setOptions] = useState<string[]>(['']);
  const [maxResponses, setMaxResponses] = useState<number>(1); // Default value of 1 response
  const [isLoading, setIsLoading] = useState(false);

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    
    const question: Question = {
      id: nanoid(),
      text: newQuestion,
      type: questionType,
      options: questionType === 'voting' ? options.filter(opt => opt.trim()) : undefined,
      maxResponses: questionType === 'wordcloud' ? maxResponses : undefined
    };
    
    setQuestions([...questions, question]);
    setNewQuestion('');
    setOptions(['']);
    setMaxResponses(1); // Reset to default after adding
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const startSession = async () => {
    if (questions.length === 0) return;
    setIsLoading(true);
    
    try {
      const sessionId = nanoid();
      const { error } = await supabase
        .from('sessions')
        .insert([
          {
            id: sessionId,
            questions: questions,
            current_question_index: 0 // Initialize with the first question
          }
        ]);

      if (error) throw error;
      navigate(`/present/${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Background with subtle pattern */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative overflow-hidden">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-50 rounded-full -ml-12 -mb-12 opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-yellow-50 rounded-full -mr-8 -mb-8 opacity-40"></div>
        
        <div className="relative">
          <h1 className="text-2xl font-bold mb-4">Create Interactive Session</h1>
          
          <div className="space-y-4 mb-6">
            {/* Highlighted Question Type field */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-md border-l-2 border-blue-400">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as 'wordcloud' | 'voting')}
                className="w-full p-2 border rounded-md bg-white border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="voting">Multiple Choice</option>
                <option value="wordcloud">Word Cloud</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="w-full p-2 border rounded-md"
              />
            </div>

            {questionType === 'voting' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        if (index === options.length - 1 && e.target.value) {
                          newOptions.push('');
                        }
                        setOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 p-2 border rounded-md"
                    />
                    {index < options.length - 1 && (
                      <button
                        onClick={() => setOptions(options.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {questionType === 'wordcloud' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Responses per User
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxResponses}
                  onChange={(e) => setMaxResponses(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Each participant can submit up to this many responses
                </p>
              </div>
            )}

            <button
              onClick={addQuestion}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              Add Question
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">Questions:</h2>
            {questions.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center p-3 bg-gray-50 rounded-md">
                No questions added yet
              </p>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                  <div>
                    <span className="font-medium">#{index + 1}</span>
                    <span className="ml-2">{question.text}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      question.type === 'wordcloud' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {question.type === 'wordcloud' ? 'Word Cloud' : 'Multiple Choice'}
                    </span>
                    {question.type === 'wordcloud' && question.maxResponses && (
                      <span className="ml-2 text-sm text-gray-500">
                        (Max {question.maxResponses} {question.maxResponses === 1 ? 'response' : 'responses'})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={startSession}
            disabled={questions.length === 0 || isLoading}
            className={`w-full p-2 rounded-md flex items-center justify-center gap-2 ${
              questions.length === 0 || isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <PlayCircle size={20} />
            {isLoading ? 'Creating Session...' : 'Start Session'}
          </button>
        </div>
      </div>
    </div>
  );
}