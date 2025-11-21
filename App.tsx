import React from 'react';
import { ChatContainer } from './components/Chat/ChatContainer';

function App() {
  return (
    // The outer div ensures the background color persists even if content is short
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans antialiased selection:bg-nebula-accent/30 selection:text-nebula-glow">
      <ChatContainer />
    </div>
  );
}

export default App;