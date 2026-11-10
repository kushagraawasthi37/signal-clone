'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { api } from '@/lib/api';
import { Attachment } from '@/lib/types';
import {
  Paperclip, Send, Smile, X, Image as ImageIcon,
  FileText, Hourglass, CornerDownRight, Loader2
} from 'lucide-react';

const COMMON_EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🔥', '🎉', '❤️', '🚀', '👏', '👀', '✨'];

export function MessageInput() {
  const {
    activeConversation,
    sendMessage,
    sendTyping,
    replyToMessage,
    setReplyToMessage,
    setActiveModal
  } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input when conversation changes
  useEffect(() => {
    if (activeConversation) {
      textareaRef.current?.focus();
    }
  }, [activeConversation]);

  // Handle typing indicator
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    sendTyping(true);

    // Auto-adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const uploaded = await api.uploadFile(files[i]);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;

    const contentToSend = text.trim();
    const attachmentIds = attachments.map((a) => a.id);
    const messageType = attachments.some((a) => a.file_type.startsWith('image/')) ? 'image' : 'text';

    setText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendTyping(false);

    await sendMessage(contentToSend, messageType, attachmentIds);
  };

  if (!activeConversation) return null;

  return (
    <div className="relative bg-[#1e1e1e] border-t border-[#262626] select-none z-10 shrink-0">
      {/* Reply Banner */}
      {replyToMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#262626] border-b border-[#333333] text-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <CornerDownRight className="w-4 h-4 text-[#2090ea] shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-gray-200">
                Replying to {replyToMessage.sender.display_name}:
              </span>
              <span className="text-gray-400 ml-1 truncate">
                {replyToMessage.content || 'Attachment'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setReplyToMessage(null)}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#383a40]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex items-center space-x-2 px-4 py-2 overflow-x-auto bg-[#232428] border-b border-[#2e2f33]">
          {attachments.map((att) => {
            const isImg = att.file_type.startsWith('image/');
            return (
              <div
                key={att.id}
                className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[#2c2d31] border border-[#383a40] flex items-center justify-center"
              >
                {isImg ? (
                  <img
                    src={att.file_url.startsWith('http') ? att.file_url : `http://localhost:8000${att.file_url}`}
                    alt={att.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-6 h-6 text-gray-300" />
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-12 bg-[#28292d] border border-[#383a40] rounded-2xl shadow-2xl p-3 z-30 animate-in fade-in zoom-in-95">
          <div className="grid grid-cols-6 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  textareaRef.current?.focus();
                }}
                className="text-xl p-1.5 hover:bg-[#383a40] rounded-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-3 py-2.5 flex items-end space-x-2">
        {/* Attachment Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Add attachment"
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#282828] transition-colors shrink-0 mb-0.5"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#2090ea]" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Insert emoji"
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#282828] transition-colors shrink-0 mb-0.5"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Disappearing Messages Quick Button */}
        <button
          onClick={() => setActiveModal('disappearing')}
          title="Disappearing messages"
          className="p-2 text-gray-400 hover:text-amber-400 rounded-full hover:bg-[#282828] transition-colors shrink-0 mb-0.5 hidden sm:block"
        >
          <Hourglass className="w-4 h-4" />
        </button>

        {/* Text Area */}
        <div className="flex-1 min-h-[38px] bg-[#282828] border border-transparent focus-within:border-[#2090ea]/60 rounded-2xl px-3 py-2 flex items-center transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Signal message"
            className="w-full bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none resize-none max-h-32"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && attachments.length === 0}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 mb-0.5 shadow-md ${
            text.trim() || attachments.length > 0
              ? 'bg-[#2090ea] hover:bg-[#1b7fd1] text-white shadow-[#2090ea]/30'
              : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

