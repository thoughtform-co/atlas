'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { EntityFormData } from '@/app/admin/new-entity/page';
import styles from './ArchivistChat.module.css';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const greeting: Message = {
      id: 'greeting',
      role: 'archivist',
      content: 'Welcome, Navigator. I am the Archivist, keeper of the manifold\'s denizens. Present your offering—an image or video—and together we shall determine its nature and place in the infinite library.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greeting]);
  }, []);

  // React to analysis notes from Gemini
  useEffect(() => {
    if (analysisNotes && formData.name) {
      const analysisMessage: Message = {
        id: `analysis-${Date.now()}`,
        role: 'archivist',
        content: `I have analyzed the visual signature. ${analysisNotes}\n\nThe entity appears to be of the **${formData.type}** class, with ${formData.threatLevel.toLowerCase()} threat potential. I have pre-filled the parameters based on my observations.\n\nWhat designation would you assign to this entity?`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, analysisMessage]);
      setStatus('Analysis complete');
    }
  }, [analysisNotes, formData.name, formData.type, formData.threatLevel]);

  // Format time
  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Check for lore consistency
  const checkConsistency = useCallback(async (userMessage: string): Promise<Message | null> => {
    // Simple consistency checks based on form data
    const warnings: { title: string; text: string }[] = [];

    // Check if allegiance conflicts with type
    if (formData.type === 'Void-Born' && formData.allegiance === 'Nomenclate') {
      warnings.push({
        title: 'Lore Consistency Alert',
        text: 'Void-Born entities rarely align with the Nomenclate. The Nomenclate seeks to crystallize meaning, while Void-Born entities emerge from conceptual absence. Consider if this alignment is intentional.',
      });
    }

    // Check if threat level seems inconsistent with type
    if (formData.type === 'Guardian' && formData.threatLevel === 'Existential') {
      warnings.push({
        title: 'Classification Anomaly',
        text: 'Guardians typically protect and stabilize. An Existential threat level suggests this entity may have been corrupted or serves a paradoxical purpose.',
      });
    }

    // Check coordinates for extreme values
    const maxCoord = Math.max(
      Math.abs(formData.coordinates.geometry),
      Math.abs(formData.coordinates.alterity),
      Math.abs(formData.coordinates.dynamics)
    );
    if (maxCoord > 0.9) {
      warnings.push({
        title: 'Manifold Edge Warning',
        text: 'This entity\'s coordinates place it near the manifold\'s edge. Entities at such extremes often exhibit unstable behavior or may be difficult to catalog accurately.',
      });
    }

    if (warnings.length > 0) {
      return {
        id: `warning-${Date.now()}`,
        role: 'archivist',
        content: 'I must note a concern:',
        timestamp: formatTime(),
        warning: warnings[0],
      };
    }

    return null;
  }, [formData]);

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
    setInputValue('');
    setIsLoading(true);
    setStatus('Processing...');

    try {
      // Check for consistency warnings
      const warningMessage = await checkConsistency(inputValue);
      
      // Generate response based on context
      let responseContent = '';
      
      if (inputValue.toLowerCase().includes('name') || inputValue.toLowerCase().includes('designation')) {
        responseContent = `**${formData.name || 'The entity'}** — a fitting designation. I shall commit this to the archive.`;
      } else if (inputValue.toLowerCase().includes('threat') || inputValue.toLowerCase().includes('danger')) {
        responseContent = `The threat assessment of **${formData.threatLevel}** has been noted. ${formData.threatLevel === 'Existential' ? 'Approach with extreme caution. This entity threatens the fundamental structures of the manifold.' : 'Standard cataloging protocols apply.'}`;
      } else if (inputValue.toLowerCase().includes('confirm') || inputValue.toLowerCase().includes('save')) {
        responseContent = 'Very well. The classification appears complete. You may now commit this entity to the Archive using the save function. May the manifold remember it well.';
      } else {
        // Default responses
        const responses = [
          'Understood. I have noted your observation. Is there anything else you wish to clarify about this entity\'s nature?',
          'The pattern becomes clearer. Your insights help refine the classification. What else can you tell me?',
          'I have recorded this information. The entity\'s profile grows more defined. Shall we proceed to finalize the cataloging?',
          'Fascinating. This detail adds depth to our understanding of the entity. Do you have further observations to share?',
        ];
        responseContent = responses[Math.floor(Math.random() * responses.length)];
      }

      const archivistResponse: Message = {
        id: `archivist-${Date.now()}`,
        role: 'archivist',
        content: responseContent,
        timestamp: formatTime(),
      };

      // Add warning if present, then response
      if (warningMessage) {
        setMessages(prev => [...prev, warningMessage]);
        setTimeout(() => {
          setMessages(prev => [...prev, archivistResponse]);
        }, 500);
      } else {
        setMessages(prev => [...prev, archivistResponse]);
      }

      setStatus('Ready');
    } catch (error) {
      console.error('Chat error:', error);
      setStatus('Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <div className={styles.avatar}>◇</div>
          <div>
            <div className={styles.name}>The Archivist</div>
            <div className={styles.role}>Entity Cataloguer</div>
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
                __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }} />
              
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
              <span className={styles.typing}>...</span>
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
            placeholder="Respond to the Archivist..."
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

