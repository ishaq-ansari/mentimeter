import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { WordCloud } from './WordCloud';
import { VotingChart } from './VotingChart';
import { supabase } from '../supabase';

interface Question {
  id: string;
  text: string;
  type: 'wordcloud' | 'voting';
  options?: string[];
}

export function PresentationScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [joinUrl, setJoinUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      setJoinUrl(`${window.location.origin}/join/${sessionId}`);
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId && !loading && !error) {
      updateCurrentQuestion();
    }
  }, [currentQuestionIndex]);

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('questions, current_question_index')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Session not found');

      setQuestions(data.questions);

      if (data.current_question_index !== undefined) {
        setCurrentQuestionIndex(data.current_question_index);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Session not found');
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentQuestion = async () => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ current_question_index: currentQuestionIndex })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating current question:', error);
      }
    } catch (err) {
      console.error('Error updating session:', err);
    }
  };

  const changeQuestion = (newIndex: number) => {
    setCurrentQuestionIndex(newIndex);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
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

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div>No questions found in this session</div>;
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Solid blue background with subtle pattern */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-blue-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-20 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-6000"></div>
      </div>

      <div className="relative z-10">
        <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Question {currentQuestionIndex + 1}/{questions.length}</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => changeQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-all"
                aria-label="Previous question"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => changeQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-all"
                aria-label="Next question"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl mb-4 text-gray-700 font-medium">{currentQuestion.text}</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-50 overflow-hidden">
              {currentQuestion.type === 'wordcloud' ? (
                <WordCloud sessionId={sessionId!} questionId={currentQuestion.id} />
              ) : (
                <VotingChart
                  sessionId={sessionId!}
                  questionId={currentQuestion.id}
                  options={currentQuestion.options || []}
                />
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Share with participants:</h3>
            <div className="flex gap-6 items-center">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <QRCodeSVG value={joinUrl} size={128} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={joinUrl}
                    readOnly
                    className="flex-1 p-2 border rounded-md bg-white"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <LinkIcon size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Share this link or QR code with your participants to let them join the session
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 20s infinite alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}</style>
    </div>
  );
}