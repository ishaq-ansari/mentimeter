import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { supabase } from '../supabase';

interface WordData {
  text: string;
  size: number;
}

interface Props {
  sessionId: string;
  questionId: string;
}

export function WordCloud({ sessionId, questionId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [words, setWords] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const updateWords = async () => {
      const { data, error } = await supabase
        .from('responses')
        .select('response')
        .eq('session_id', sessionId)
        .eq('question_id', questionId);

      if (error) {
        console.error('Error fetching responses:', error);
        return;
      }

      const wordCount: { [key: string]: number } = {};
      data.forEach(({ response }) => {
        const word = response.toLowerCase();
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      setWords(wordCount);
    };

    updateWords();
    const interval = setInterval(updateWords, 1000);
    return () => clearInterval(interval);
  }, [sessionId, questionId]);

  useEffect(() => {
    if (!svgRef.current || Object.keys(words).length === 0) return;

    const width = 800;
    const height = 400;

    const wordData: WordData[] = Object.entries(words).map(([text, count]) => ({
      text,
      size: 20 + (count * 10)
    }));

    // Clear previous rendering
    d3.select(svgRef.current).selectAll("*").remove();

    // Create a static layout with predetermined positions
    const layout = cloud()
      .size([width, height])
      .words(wordData)
      .padding(10) // Increase padding between words
      .rotate(0) // No rotation for better readability
      .random(() => 0.5) // Consistent random seed for stability
      .fontSize(d => (d as WordData).size)
      .on("end", draw);

    // Start layout calculation
    layout.start();

    function draw(words: any[]) {
      const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      const group = svg.append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

      group.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", d => `${d.size}px`)
        .style("font-family", "Arial, sans-serif")
        .style("font-weight", "bold")
        .style("fill", (d, i) => {
          // Use a fixed palette rather than random colors for consistency
          const colors = d3.schemeCategory10;
          return colors[i % colors.length];
        })
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .text(d => d.text);
    }
  }, [words]);

  return (
    <div className="bg-white rounded-lg p-4">
      <svg ref={svgRef} className="w-full h-[400px]" />
      {Object.keys(words).length === 0 && (
        <div className="flex justify-center items-center h-[300px] text-gray-500">
          Waiting for responses...
        </div>
      )}
    </div>
  );
}