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
      setError(null);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Session not found');
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Question {currentQuestionIndex + 1}/{questions.length}</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl mb-4">{currentQuestion.text}</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
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
          <h3 className="text-lg font-semibold mb-4">Share with participants:</h3>
          <div className="flex gap-6 items-center">
            <QRCodeSVG value={joinUrl} size={128} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={joinUrl}
                  readOnly
                  className="flex-1 p-2 border rounded-md bg-gray-50"
                />
                <button
                  onClick={copyLink}
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
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
  );
}