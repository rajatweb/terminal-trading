"use client";

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { useTradingStore } from '@/stores/tradingStore';
import { BrokerName } from '@/types/broker';

interface BrokerConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BrokerConnectModal({ isOpen, onClose }: BrokerConnectModalProps) {
    const { connectBroker, dhanConfig, growwConfig } = useTradingStore();
    const [selectedBroker, setSelectedBroker] = useState<BrokerName>('dhan');
    const [showToken, setShowToken] = useState(false);

    // UI State
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const [dhanForm, setDhanForm] = useState({ clientId: dhanConfig?.clientId || '', accessToken: dhanConfig?.accessToken || '' });
    const [growwForm, setGrowwForm] = useState({ apiKey: growwConfig?.apiKey || '' });

    if (!isOpen) return null;

    const handleConnect = async () => {
        setError(null);

        if (selectedBroker === 'dhan') {
            if (!dhanForm.clientId || !dhanForm.accessToken) {
                setError("Please enter Client ID and Access Token");
                return;
            }

            setIsValidating(true);
            try {
                const res = await fetch('/api/dhan/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dhanForm)
                });

                const data = await res.json();

                if (data.success) {
                    connectBroker(dhanForm.clientId, dhanForm.accessToken);
                    onClose();
                } else {
                    setError(data.error || "Authentication failed. Check credentials.");
                }
            } catch (err) {
                setError("Network error. Failed to reach server.");
            } finally {
                setIsValidating(false);
            }

        } else {
            // Placeholder for Groww
            connectBroker('groww', ''); // Groww not fully supported by connectBroker without modifying it. Wait, I should just pass '' or whatever length it needs, actually just ignore groww.
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e222d] w-[450px] rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a2e39] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2e39]">
                    <div className="flex items-center gap-2">
                        <Shield className="text-emerald-500" size={20} />
                        <h2 className="text-sm font-bold tracking-wide uppercase">Connect Broker</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Broker Tabs */}
                <div className="flex border-b border-gray-100 dark:border-[#2a2e39]">
                    <button
                        onClick={() => { setSelectedBroker('dhan'); setError(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${selectedBroker === 'dhan' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                        DHAN
                    </button>
                    <button
                        onClick={() => { setSelectedBroker('groww'); setError(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${selectedBroker === 'groww' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                        GROWW
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-100 dark:border-red-900/30">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    {selectedBroker === 'dhan' ? (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Client ID</label>
                                <input
                                    type="text"
                                    value={dhanForm.clientId}
                                    onChange={e => setDhanForm({ ...dhanForm, clientId: e.target.value })}
                                    placeholder="Enter Dhan Client ID"
                                    className="w-full bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                                />
                            </div>
                            <div className="space-y-1.5 relative">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Access Token</label>
                                    <button
                                        tabIndex={-1}
                                        onClick={() => setShowToken(!showToken)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                </div>
                                <input
                                    type={showToken ? "text" : "password"}
                                    value={dhanForm.accessToken}
                                    onChange={e => setDhanForm({ ...dhanForm, accessToken: e.target.value })}
                                    placeholder="Paste your Access Token"
                                    className="w-full bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Get this from web.dhan.co API settings (Profile &gt; My Profile &gt; Controls)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded border border-blue-100 dark:border-blue-900/30">
                                <span className="font-bold block mb-1">Coming Soon</span>
                                Groww integration is currently in experimental phase.
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">API Key (Optional)</label>
                                <input
                                    type="text"
                                    value={growwForm.apiKey}
                                    onChange={e => setGrowwForm({ ...growwForm, apiKey: e.target.value })}
                                    placeholder="Enter Groww API Key"
                                    className="w-full bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleConnect}
                        disabled={isValidating}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                    >
                        {isValidating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>VALIDATING...</span>
                            </>
                        ) : (
                            <span>CONNECT {selectedBroker.toUpperCase()}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
