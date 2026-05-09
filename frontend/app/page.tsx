"use client";

import React, { useState, useEffect } from 'react';

export default function ChatApp() {
  type Message = {
    role: 'user' | 'assistant';
    text: string;
    sql?: string | null;
    dbTable?: any[] | null;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save theme preference to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleSend = async () => {
    if (!input) return;
    setLoading(true);
    const newMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    // Clear the input immediately so the UI feels responsive
    setInput('');

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userGoal: input })
      });
      const data = await res.json();

      const assistantMsg: Message = {
        role: 'assistant',
        text: data.assistantText,
        sql: data.sql,
        dbTable: Array.isArray(data.data) ? data.data : null
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error("Chat error", e);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className={`flex flex-col h-screen font-sans transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-950 text-gray-100' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <header className={`p-4 border-b sticky top-0 z-10 text-center transition-colors duration-300 ${
        isDarkMode
          ? 'border-gray-800 bg-gray-900/50 backdrop-blur-md'
          : 'border-gray-200 bg-gray-50/50 backdrop-blur-md'
      }`}>
        <div className="flex items-center justify-center gap-4">
          <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            DB MCP Agent
          </h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors duration-300 ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <span className="text-xl">☀️</span>
            ) : (
              <span className="text-xl">🌙</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Chat Area - Centered Box */}
      <main className={`flex-1 overflow-y-auto w-full max-w-3xl mx-auto p-4 space-y-6 scrollbar-thin transition-colors duration-300 ${
        isDarkMode ? 'scrollbar-thumb-gray-700' : 'scrollbar-thumb-gray-300'
      }`}>
        {messages.length === 0 && (
          <div className={`h-full flex items-center justify-center italic ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Start a conversation with your database...
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl shadow-lg transition-colors duration-300 ${
              m.role === 'user' 
                ? isDarkMode
                  ? 'bg-blue-700 text-white rounded-tr-none' 
                  : 'bg-blue-600 text-white rounded-tr-none'
                : isDarkMode
                ? 'bg-gray-800 border border-gray-700 rounded-tl-none'
                : 'bg-gray-100 border border-gray-300 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{m.text}</p>

              {m.sql && (
                <div className="mt-3">
                  <span className={`text-[10px] uppercase font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Generated SQL</span>
                  <code className={`block mt-1 p-3 text-xs rounded-lg border overflow-x-auto transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-black/50 text-green-400 border-green-900/30'
                      : 'bg-gray-50 text-green-700 border-green-300'
                  }`}>
                    {m.sql}
                  </code>
                </div>
              )}

              {m.dbTable && m.dbTable.length > 0 && (
                <div className={`mt-4 overflow-hidden rounded-lg shadow-inner transition-colors duration-300 ${
                  isDarkMode
                    ? 'border border-gray-700'
                    : 'border border-gray-300'
                }`}>
                  <table className="min-w-full text-xs text-left">
                    <thead className={`uppercase transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700/50 text-gray-300'
                        : 'bg-gray-100/50 text-gray-700'
                    }`}>
                      <tr>
                        {Object.keys(m.dbTable[0]).map(k => (
                          <th key={k} className={`px-3 py-2 font-semibold border-b transition-colors duration-300 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-300'
                          }`}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y transition-colors duration-300 ${
                      isDarkMode
                        ? 'divide-gray-700 bg-gray-800/30'
                        : 'divide-gray-300 bg-white/30'
                    }`}>
                      {m.dbTable.map((row, ri) => (
                        <tr key={ri} className={`transition-colors duration-300 ${
                          isDarkMode
                            ? 'hover:bg-gray-700/30'
                            : 'hover:bg-gray-100/30'
                        }`}>
                          {Object.values(row).map((val: any, vi) => (
                            <td key={vi} className={`px-3 py-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`p-4 rounded-2xl rounded-tl-none animate-pulse text-sm transition-colors duration-300 ${
              isDarkMode
                ? 'bg-gray-800 border border-gray-700 text-gray-500'
                : 'bg-gray-100 border border-gray-300 text-gray-600'
            }`}>
              Agent is querying the database...
            </div>
          </div>
        )}
      </main>

      {/* Input Area - Centered Box */}
      <footer className={`p-6 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-950/80 backdrop-blur-sm'
          : 'bg-white/80 backdrop-blur-sm border-t border-gray-200'
      }`}>
        <div className={`max-w-3xl mx-auto flex gap-3 p-2 rounded-2xl shadow-2xl transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gray-50 border border-gray-300'
        }`}>
          <input
            className={`flex-1 p-3 text-sm outline-none bg-transparent transition-colors duration-300 ${
              isDarkMode
                ? 'placeholder-gray-500'
                : 'placeholder-gray-400'
            }`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g., Show me all employees living in Istanbul"
          />
          <button 
            onClick={handleSend} 
            disabled={loading}
            className={`text-white px-5 py-2 rounded-xl font-bold transition-all flex items-center justify-center ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700'
                : 'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Send"
            )}
          </button>
        </div>
        <p className={`text-center text-[10px] mt-3 uppercase tracking-widest transition-colors duration-300 ${
          isDarkMode
            ? 'text-gray-600'
            : 'text-gray-600'
        }`}>
          Powered by MCP & Ollama; made with ❤️ by <a href="https://github.com/amwolfox" target="_blank" rel="noopener noreferrer" className={`hover:underline transition-colors duration-300 ${
            isDarkMode
              ? 'text-blue-400'
              : 'text-blue-600'
          }`}>
            amwolfox
          </a>
        </p>
      </footer>
    </div>
  );
}