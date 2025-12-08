'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { EntityFormData } from '@/app/admin/new-entity/page';
import styles from './ArchivistChat.module.css';

interface ToolUsage {
  name: string;
  success: boolean;
  error?: string;
  durationMs?: number;
}

interface Message {
  id: string;
  role: 'archivist' | 'user';
  content: string;
  timestamp: string;
  warning?: {
    title: string;
    text: string;
  };
  fieldSuggestion?: Partial<EntityFormData>;
  toolsUsed?: ToolUsage[];
}

interface ArchivistChatProps {
  formData: EntityFormData;
  onApplyField: (updates: Partial<EntityFormData>) => void;
  analysisNotes?: string;
}

export function ArchivistChat({ formData, onApplyField, analysisNotes }: ArchivistChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Awaiting input...');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    initializeSession();
  }, []);

  // Initialize a new Archivist session
  const initializeSession = async () => {
    try {
      setStatus('Connecting to Archivist...');
      const response = await fetch('/api/archivist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous', // TODO: Use actual user ID from auth
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        const greeting: Message = {
          id: 'greeting',
          role: 'archivist',
          content: data.message,
          timestamp: formatTime(),
        };
        setMessages([greeting]);
        setStatus('Ready');
      } else {
        // Fallback to local greeting if API fails
        const greeting: Message = {
          id: 'greeting',
          role: 'archivist',
          content: '*awaits*\n\nWelcome, Navigator. What entity shall we explore today? You can share an image, describe what you\'ve witnessed, or ask about patterns in the archive.',
          timestamp: formatTime(),
        };
        setMessages([greeting]);
        setStatus('Offline mode');
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      // Fallback greeting
      const greeting: Message = {
        id: 'greeting',
        role: 'archivist',
        content: '*awaits*\n\nWelcome, Navigator. What entity shall we explore today? (Note: Operating in offline mode)',
        timestamp: formatTime(),
      };
      setMessages([greeting]);
      setStatus('Offline mode');
    }
  };

  // React to analysis notes from Gemini
  useEffect(() => {
    if (analysisNotes && formData.name) {
      const analysisMessage: Message = {
        id: `analysis-${Date.now()}`,
        role: 'archivist',
        content: `*studies the visual signature*\n\n${analysisNotes}\n\nThe entity appears to be of the **${formData.type}** class, with ${formData.threatLevel.toLowerCase()} threat potential. I have pre-filled the parameters based on my observations.\n\nWhat designation would you assign to this entity?`,
        timestamp: formatTime(),
      };
      setMessages(prev => [...prev, analysisMessage]);
      setStatus('Analysis complete');
    }
  }, [analysisNotes, formData.name, formData.type, formData.threatLevel]);

  // Format time
  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Toggle tool details expansion
  const toggleToolExpansion = (messageId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Send message to archivist
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: formatTime(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);
    setStatus('Processing...');

    try {
      // Call the Archivist API if we have a session
      if (sessionId) {
        const response = await fetch('/api/archivist/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: messageText,
            imageUrl: formData.mediaUrl, // Pass image URL if available
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          const archivistResponse: Message = {
            id: `archivist-${Date.now()}`,
            role: 'archivist',
            content: data.message,
            timestamp: formatTime(),
            toolsUsed: data.toolsUsed,
          };

          // Add warnings if present
          if (data.warnings && data.warnings.length > 0) {
            archivistResponse.warning = {
              title: 'Observation',
              text: data.warnings.join(' '),
            };
          }

          setMessages(prev => [...prev, archivistResponse]);
          
          // Apply extracted fields if any
          if (data.extractedFields && Object.keys(data.extractedFields).length > 0) {
            // Map extracted fields to form data format
            const updates: Partial<EntityFormData> = {};
            if (data.extractedFields.name) updates.name = data.extractedFields.name;
            if (data.extractedFields.type) updates.type = data.extractedFields.type;
            if (data.extractedFields.domain) updates.domain = data.extractedFields.domain;
            if (data.extractedFields.description) updates.description = data.extractedFields.description;
            if (data.extractedFields.allegiance) updates.allegiance = data.extractedFields.allegiance;
            if (data.extractedFields.threatLevel) updates.threatLevel = data.extractedFields.threatLevel;
            
            if (Object.keys(updates).length > 0) {
              onApplyField(updates);
            }
          }

          setStatus(data.isComplete ? 'Classification complete' : 'Ready');
        } else {
          // Fallback to local response
          await handleLocalResponse(messageText);
        }
      } else {
        // No session - use local response
        await handleLocalResponse(messageText);
      }
    } catch (error) {
      console.error('Chat error:', error);
      await handleLocalResponse(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  // Local fallback response when API is unavailable
  const handleLocalResponse = async (messageText: string) => {
    let responseContent = '';
    
    if (messageText.toLowerCase().includes('name') || messageText.toLowerCase().includes('designation')) {
      responseContent = `**${formData.name || 'The entity'}** — a fitting designation. I shall note this in the archive.`;
    } else if (messageText.toLowerCase().includes('threat') || messageText.toLowerCase().includes('danger')) {
      responseContent = `The threat assessment of **${formData.threatLevel}** has been noted. ${formData.threatLevel === 'Existential' ? 'Approach with extreme caution.' : 'Standard cataloging protocols apply.'}`;
    } else if (messageText.toLowerCase().includes('confirm') || messageText.toLowerCase().includes('save')) {
      responseContent = 'The classification appears complete. You may now commit this entity to the Archive.';
    } else {
      const responses = [
        'Understood. I have noted your observation. Is there anything else you wish to clarify?',
        'The pattern becomes clearer. Your insights help refine the classification.',
        'I have recorded this information. Shall we proceed to finalize?',
        'Fascinating. This detail adds depth to our understanding.',
      ];
      responseContent = responses[Math.floor(Math.random() * responses.length)];
    }

    const archivistResponse: Message = {
      id: `archivist-${Date.now()}`,
      role: 'archivist',
      content: responseContent,
      timestamp: formatTime(),
    };

    setMessages(prev => [...prev, archivistResponse]);
    setStatus('Ready (offline)');
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render tool usage indicator
  const renderToolUsage = (msg: Message) => {
    if (!msg.toolsUsed || msg.toolsUsed.length === 0) return null;

    const isExpanded = expandedTools.has(msg.id);
    const successCount = msg.toolsUsed.filter(t => t.success).length;
    const failCount = msg.toolsUsed.filter(t => !t.success).length;

    return (
      <div className={styles.toolUsage}>
        <button 
          className={styles.toolToggle}
          onClick={() => toggleToolExpansion(msg.id)}
        >
          <span className={styles.toolIcon}>⚙</span>
          <span className={styles.toolSummary}>
            {msg.toolsUsed.length} tool{msg.toolsUsed.length !== 1 ? 's' : ''} used
            {failCount > 0 && <span className={styles.toolFail}> ({failCount} failed)</span>}
          </span>
          <span className={styles.toolChevron}>{isExpanded ? '▼' : '▶'}</span>
        </button>
        
        {isExpanded && (
          <div className={styles.toolDetails}>
            {msg.toolsUsed.map((tool, idx) => (
              <div key={idx} className={`${styles.toolItem} ${tool.success ? styles.toolSuccess : styles.toolError}`}>
                <span className={styles.toolName}>{tool.name}</span>
                <span className={styles.toolStatus}>
                  {tool.success ? '✓' : '✗'}
                  {tool.durationMs && <span className={styles.toolDuration}>{tool.durationMs}ms</span>}
                </span>
                {tool.error && <span className={styles.toolErrorText}>{tool.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <div className={styles.avatar}>◇</div>
          <div>
            <div className={styles.name}>The Archivist</div>
            <div className={styles.role}>Semantic Cartographer</div>
          </div>
        </div>
        <div className={styles.status}>{status}</div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.messageContent}>
              <span dangerouslySetInnerHTML={{ 
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br />')
              }} />
              
              {renderToolUsage(msg)}
              
              {msg.warning && (
                <div className={styles.warning}>
                  <div className={styles.warningHeader}>⚠ {msg.warning.title}</div>
                  <div className={styles.warningText}>{msg.warning.text}</div>
                </div>
              )}
              
              {msg.fieldSuggestion && (
                <button 
                  className={styles.applyButton}
                  onClick={() => onApplyField(msg.fieldSuggestion!)}
                >
                  Apply Suggestion
                </button>
              )}
            </div>
            <div className={styles.messageTime}>{msg.timestamp}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className={`${styles.message} ${styles.archivist}`}>
            <div className={styles.messageContent}>
              <span className={styles.typing}>
                <span className={styles.typingDot}>.</span>
                <span className={styles.typingDot}>.</span>
                <span className={styles.typingDot}>.</span>
              </span>
              <span className={styles.typingStatus}>consulting the archive</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrap}>
          <input
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about patterns, connections, or describe the entity..."
            disabled={isLoading}
          />
          <button 
            className={styles.sendButton}
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
