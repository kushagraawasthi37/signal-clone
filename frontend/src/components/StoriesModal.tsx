'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { X, ChevronLeft, ChevronRight, Sparkles, Plus, Lock } from 'lucide-react';

interface Story {
  id: string;
  author: string;
  avatar_url?: string;
  time: string;
  image_url: string;
  caption: string;
}

const SAMPLE_STORIES: Story[] = [
  {
    id: 's1',
    author: 'Moxie Marlinspike',
    time: '2h ago',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    caption: 'Sailing off the coast. Testing Signal satellite link relay. ⛵'
  },
  {
    id: 's2',
    author: 'Alice Zhang',
    time: '4h ago',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
    caption: 'Verifying cryptographic post-quantum algorithms for Signal 2026! 🔐'
  },
  {
    id: 's3',
    author: 'Edward Snowden',
    time: '6h ago',
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
    caption: 'Privacy is the power to selectively reveal yourself to the world.'
  }
];

export function StoriesModal() {
  const { activeModal, setActiveModal } = useChat();
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (activeModal !== 'stories') return null;

  const currentStory = SAMPLE_STORIES[currentIndex];

  const handleNext = () => {
    if (currentIndex < SAMPLE_STORIES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setActiveModal(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm h-[580px] bg-[#1a1b1e] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10">
        {/* Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex space-x-1.5">
          {SAMPLE_STORIES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all ${
                idx < currentIndex
                  ? 'bg-white'
                  : idx === currentIndex
                  ? 'bg-[#2090ea]'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Story Header */}
        <div className="relative z-30 px-4 pt-6 pb-2 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2090ea] flex items-center justify-center text-xs font-bold ring-2 ring-white">
              {currentStory.author.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight">{currentStory.author}</div>
              <div className="text-[10px] text-gray-300 flex items-center space-x-1">
                <span>{currentStory.time}</span>
                <span>•</span>
                <Lock className="w-2.5 h-2.5 text-[#2090ea]" />
                <span>Encrypted Story</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 rounded-full bg-black/40 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Background Image */}
        <div className="absolute inset-0 z-10">
          <img
            src={currentStory.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        </div>

        {/* Navigation tap areas */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
        />
        <button
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 w-2/3 z-20 cursor-pointer"
        />

        {/* Caption & Footer */}
        <div className="relative z-30 p-5 text-white">
          <p className="text-sm font-medium mb-4 drop-shadow">
            {currentStory.caption}
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Send encrypted reply..."
              className="flex-1 px-4 py-2 bg-black/50 border border-white/20 rounded-full text-xs text-white placeholder-gray-300 focus:outline-none focus:border-[#2090ea]"
            />
            <button
              onClick={() => {
                alert('Reply sent to story!');
                handleNext();
              }}
              className="px-3 py-2 bg-[#2090ea] hover:bg-[#1b7fd1] text-xs font-medium rounded-full text-white"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
