/**
 * ENGINEERVERSE — Ask Pritee: Engineering Edition
 * Implements EV-027 & EV-028
 * Features 4 distinct mentor personas:
 * 1. Student (Pedagogical / Structured)
 * 2. Curious (ELI5 / Chai analogies / No gatekeeping)
 * 3. Engineer (Systems depth / Distributed trade-offs / Latency)
 * 4. Career (Engineering craft / Hard truths / Technical debt)
 */

import { useState } from 'react';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { TabPill } from './ui/TabPill.jsx';
import { MENTOR_MODES, PRITEE_SUGGESTED_QUESTIONS, askPritee } from '../services/priteeClient.js';
import { analytics } from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../config/analyticsEvents.js';
import { Bot, Send, Sparkles, User, RefreshCw } from 'lucide-react';

export function PriteeMentorPreview() {
  const [activeMode, setActiveMode] = useState('curious');
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      role: 'assistant',
      mode: 'curious',
      text: 'Namaste! I am Pritee AI: Engineering Edition. Whether you are wondering why GPS requires Einstein\'s relativity, how a database index resembles an index at the back of a cookbook, or what trade-offs govern distributed systems—ask me anything.',
      timestamp: 'Just now',
    },
  ]);

  const handleSendMessage = async (questionText = inputQuestion) => {
    const q = questionText.trim();
    if (!q || isLoading) return;

    const userMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: q,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    analytics.track(ANALYTICS_EVENTS.AI_QUESTION, {
      questionLength: q.length,
      mode: activeMode,
    });

    try {
      const response = await askPritee({
        question: q,
        mode: activeMode,
      });

      const botMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        mode: activeMode,
        text: response.text || response.answer,
        timestamp: 'Just now',
        isFallback: response.isFallback,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_err_' + Date.now(),
          role: 'assistant',
          mode: activeMode,
          text: 'मैं अभी इस जवाब को तैयार नहीं कर पा रही हूँ। थोड़ी देर बाद फिर कोशिश करें। (All upstream engineering intelligence channels are currently resting or rate-limited. Please retry shortly.)',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Title Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="purple" size="xs">Adaptive Engineering AI</Badge>
          <span className="text-xs text-purple-400 font-semibold">4 Tailored Mental Models</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ask Pritee: Engineering Edition.
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
          An AI engineering mentor that adapts its pedagogy to your curiosity level.
        </p>
      </div>

      {/* Mentor Mode Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {Object.values(MENTOR_MODES).map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
              className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-950/80 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : 'bg-[#09091d] border-purple-950/40 text-slate-300 hover:bg-[#0e0e2a] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{mode.title}</span>
              </div>
              <p className="text-[11px] text-purple-200/70 line-clamp-2 leading-relaxed">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-purple-400/80 shrink-0 mr-1 font-semibold">Suggested:</span>
        {PRITEE_SUGGESTED_QUESTIONS.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(sq)}
            className="text-xs px-3 py-1 rounded-full bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-900/40 whitespace-nowrap cursor-pointer transition-all"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-900">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-sm'
                    : 'bg-[#0e0e28] text-slate-200 border border-purple-950/60 rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' && msg.mode && (
                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      {MENTOR_MODES[msg.mode.toUpperCase()]?.title || msg.mode}
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-700 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-purple-300 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-purple-900/60 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              </div>
              <span>Pritee is analyzing your question through the {activeMode} lens...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-3 border-t border-purple-950/50 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask Pritee anything in ${activeMode.toUpperCase()} mode...`}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            className="flex-1 p-3 rounded-full bg-[#08081a] border border-purple-950/60 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Send}
            disabled={!inputQuestion.trim() || isLoading}
          >
            Ask
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default PriteeMentorPreview;
