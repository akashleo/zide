'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Bot, ArrowRight } from 'lucide-react';
import './AiPanel.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function formatTime(ts: number) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts));
}

export function AiPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'This is a placeholder response. AI integration coming soon.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 1400);
  }, [input, isThinking]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-header-left">
          <div className="ai-panel-icon-wrapper">
            <div className="ai-panel-icon-glow" />
            <div className={`ai-panel-icon-dot${isThinking ? ' ai-panel-icon-dot--thinking' : ''}`} />
          </div>
          <span className="ai-panel-title">Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="ai-panel-close-btn"
          title="Close panel (Ctrl+L)"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Message feed */}
      <div className="ai-panel-feed">
        {messages.length === 0 && !isThinking ? (
          <div className="ai-panel-empty">
            <p className="ai-panel-empty-main">
              Ask anything about your codebase
            </p>
            <p className="ai-panel-empty-hint">
              ↵ send · ⇧↵ newline
            </p>
          </div>
        ) : (
          <div className="ai-panel-messages">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`ai-panel-message ${msg.role === 'user' ? 'ai-panel-message--user' : 'ai-panel-message--assistant'}`}
                style={{ '--index': idx } as React.CSSProperties}
              >
                {msg.role === 'user' ? (
                  <div className="ai-user-bubble">
                    <p className="ai-bubble-text">{msg.content}</p>
                  </div>
                ) : (
                  <div className="ai-assistant-message">
                    <div className="ai-message-label-row">
                      <Bot className="ai-message-label-icon" size={12} strokeWidth={2.5} />
                      <span className="ai-message-label-text">ASSISTANT</span>
                    </div>
                    <div className="ai-assistant-bubble">
                      <p className="ai-bubble-text">{msg.content}</p>
                    </div>
                  </div>
                )}
                <span className="ai-timestamp">{formatTime(msg.timestamp)}</span>
              </div>
            ))}

            {/* Thinking state */}
            {isThinking && (
              <div className="ai-thinking" style={{ '--index': messages.length } as React.CSSProperties}>
                <div className="ai-message-label-row">
                  <Bot className="ai-thinking-icon" size={12} strokeWidth={2.5} />
                  <span className="ai-thinking-label">THINKING</span>
                </div>
                <div className="ai-thinking-bubble">
                  <div className="ai-thinking-dots">
                    <span className="ai-thinking-dot ai-thinking-dot--1" />
                    <span className="ai-thinking-dot ai-thinking-dot--2" />
                    <span className="ai-thinking-dot ai-thinking-dot--3" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input dock */}
      <div className="ai-input-dock">
        <div
          className="ai-input-container"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message assistant…"
            rows={1}
            className="ai-textarea"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="ai-send-btn"
            title="Send (Enter)"
          >
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
        <p className="ai-input-hint">
          Enter · Send &nbsp;·&nbsp; Shift+Enter · Newline
        </p>
      </div>
    </div>
  );
}
