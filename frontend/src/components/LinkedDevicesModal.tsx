'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { X, Laptop, Tablet, Smartphone, QrCode, Plus, Check } from 'lucide-react';

export function LinkedDevicesModal() {
  const { activeModal, setActiveModal } = useChat();
  const [showScanner, setShowScanner] = useState(false);
  const [devices, setDevices] = useState([
    { id: '1', name: 'Signal Desktop - Windows', type: 'laptop', time: 'Active now', current: true },
    { id: '2', name: 'Signal iPad Pro', type: 'tablet', time: 'Linked 4 days ago • Last sync today', current: false },
  ]);

  if (activeModal !== 'linked_devices') return null;

  const handleUnlink = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2f]">
          <h3 className="font-semibold text-base text-gray-100 flex items-center space-x-2">
            <Laptop className="w-5 h-5 text-[#2090ea]" />
            <span>Linked Devices</span>
          </h3>
          <button
            onClick={() => { setActiveModal(null); setShowScanner(false); }}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282828]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showScanner ? (
            <>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                No conversations are ever stored on Signal servers. All message histories and encryption keys are synchronized end-to-end between your linked devices.
              </p>

              <div className="space-y-2 mb-6">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#28292d] border border-[#383a40]"
                  >
                    <div className="flex items-center space-x-3">
                      {device.type === 'laptop' ? (
                        <Laptop className="w-5 h-5 text-[#2090ea]" />
                      ) : (
                        <Tablet className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white">{device.name}</div>
                        <div className="text-[11px] text-gray-400">{device.time}</div>
                      </div>
                    </div>

                    {device.current ? (
                      <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        This Device
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUnlink(device.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Unlink
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowScanner(true)}
                className="w-full py-2.5 bg-[#2090ea] hover:bg-[#1b7fd1] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-[#2090ea]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Link New Device</span>
              </button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-300 mb-4">
                Open Signal on your phone, go to <strong>Settings &gt; Linked Devices</strong>, and scan this QR code:
              </p>

              <div className="w-48 h-48 mx-auto mb-4 bg-white p-3 rounded-2xl flex items-center justify-center border-4 border-[#2090ea] shadow-xl">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
                  <rect x="0" y="0" width="30" height="30" rx="2" fill="#000" />
                  <rect x="5" y="5" width="20" height="20" fill="#fff" />
                  <rect x="10" y="10" width="10" height="10" fill="#000" />
                  <rect x="70" y="0" width="30" height="30" rx="2" fill="#000" />
                  <rect x="75" y="5" width="20" height="20" fill="#fff" />
                  <rect x="80" y="10" width="10" height="10" fill="#000" />
                  <rect x="0" y="70" width="30" height="30" rx="2" fill="#000" />
                  <rect x="5" y="75" width="20" height="20" fill="#fff" />
                  <rect x="10" y="80" width="10" height="10" fill="#000" />
                  <rect x="42" y="20" width="16" height="16" fill="#000" />
                  <rect x="42" y="45" width="16" height="16" fill="#2090ea" />
                  <rect x="70" y="45" width="16" height="16" fill="#000" />
                  <rect x="25" y="45" width="10" height="10" fill="#000" />
                </svg>
              </div>

              <button
                onClick={() => setShowScanner(false)}
                className="px-4 py-2 bg-[#28292d] hover:bg-[#323338] text-gray-300 text-xs font-medium rounded-xl"
              >
                Back to Devices
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
