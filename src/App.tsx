import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PresentationScreen } from './components/PresentationScreen';
import { ParticipantScreen } from './components/ParticipantScreen';
import { CreateSession } from './components/CreateSession';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<CreateSession />} />
            <Route path="/present/:sessionId" element={<PresentationScreen />} />
            <Route path="/join/:sessionId" element={<ParticipantScreen />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;