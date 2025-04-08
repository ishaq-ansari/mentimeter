import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Props {
  sessionId: string;
  questionId: string;
  options: string[];
}

export function VotingChart({ sessionId, questionId, options }: Props) {
  const [votes, setVotes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const updateVotes = async () => {
      const { data, error } = await supabase
        .from('responses')
        .select('response')
        .eq('session_id', sessionId)
        .eq('question_id', questionId);

      if (error) {
        console.error('Error fetching votes:', error);
        return;
      }

      const voteCounts: { [key: string]: number } = {};
      data.forEach(({ response }) => {
        voteCounts[response] = (voteCounts[response] || 0) + 1;
      });
      setVotes(voteCounts);
    };

    updateVotes();
    const interval = setInterval(updateVotes, 1000);
    return () => clearInterval(interval);
  }, [sessionId, questionId]);

  const maxVotes = Math.max(...Object.values(votes), 1);

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{option}</span>
            <span className="text-gray-500">{votes[option] || 0} votes</span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((votes[option] || 0) / maxVotes) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}