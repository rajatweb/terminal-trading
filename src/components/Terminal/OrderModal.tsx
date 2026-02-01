
"use client";

import React, { useState } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { X, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const OrderModal: React.FC = () => {
    const { orderModal, closeOrderModal, placeOrder, marginAvailable } = useTerminalStore();
    const { isOpen, symbol, type, instrumentType, price: initialPrice, ltp } = orderModal;

    const [product, setProduct] = useState<'CNC' | 'MIS' | 'NRML'>(instrumentType === 'OPTION' ? 'NRML' : 'CNC');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>('MARKET');
    const [qty, setQty] = useState<number>(instrumentType === 'OPTION' ? 50 : 1);
    const [price, setPrice] = useState<number>(initialPrice || ltp);
    const [triggerPrice, setTriggerPrice] = useState<number>(ltp);

    const isSell = type === 'SELL';
    const isIndex = instrumentType === 'INDEX';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeOrderModal}
                        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal Content */}
                    <motion.div
                        drag
                        dragMomentum={false}
                        dragElastic={0.1}
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="w-[420px] bg-white dark:bg-[#1e222d] rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-[#363a45] overflow-hidden pointer-events-auto relative z-10"
                    >
                        {/* Header with NSE Branding */}
                        <div className={`px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-[#2a2e39] cursor-grab active:cursor-grabbing ${isSell ? 'bg-rose-500/10' : 'bg-blue-500/10'
                            }`}>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black text-white uppercase ${isSell ? 'bg-rose-600' : 'bg-blue-600'
                                        }`}>{type}</span>
                                    <span className="text-[14px] font-black text-gray-900 dark:text-[#d1d4dc] uppercase tracking-tight">{symbol}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">NSE • {instrumentType}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] font-bold text-gray-500 tabular-nums">LTP: {ltp.toFixed(2)}</span>
                                </div>
                            </div>
                            <button onClick={closeOrderModal} className="p-1.5 hover:bg-black/10 rounded-full transition-colors text-gray-500">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-5 space-y-6">
                            {isIndex ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3">
                                    <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                                    <div>
                                        <p className="text-[12px] font-black text-amber-600 uppercase tracking-tight">INDEX IS NOT TRADABLE</p>
                                        <p className="text-[11px] font-medium text-amber-600/80 mt-1 leading-relaxed">
                                            Indices cannot be traded directly in India. You can trade NIFTY/BANKNIFTY through **Options** or **ETFs (NIFTYBEES)**.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Product Toggle */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Product Type</label>
                                        <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-black/20 p-1 rounded-lg border border-gray-100 dark:border-[#2a2e39]">
                                            {(instrumentType === 'OPTION' ? ['NRML', 'MIS'] : ['CNC', 'MIS']).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setProduct(p as 'CNC' | 'MIS' | 'NRML')}
                                                    className={`py-2 rounded-md text-[11px] font-black uppercase transition-all ${product === p
                                                        ? (isSell ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20')
                                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-[#d1d4dc]'
                                                        }`}
                                                >
                                                    {p === 'CNC' ? 'Cash & Carry' : p === 'MIS' ? 'Intraday (MIS)' : 'Normal (NRML)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Qty and Price Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Quantity</label>
                                            <input
                                                type="number"
                                                value={qty}
                                                onChange={(e) => setQty(Number(e.target.value))}
                                                className="w-full bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] rounded-lg px-4 py-2.5 text-[14px] font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                            />
                                            {instrumentType === 'OPTION' && (
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">Lot Size: 50</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Price</label>
                                            <input
                                                type="number"
                                                disabled={orderType === 'MARKET'}
                                                value={orderType === 'MARKET' ? ltp : price}
                                                onChange={(e) => setPrice(Number(e.target.value))}
                                                className={`w-full bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] rounded-lg px-4 py-2.5 text-[14px] font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono ${orderType === 'MARKET' ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Order Type Toggle */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Order Type</label>
                                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-black/20 px-4 py-2 rounded-lg border border-gray-100 dark:border-[#2a2e39]">
                                            {['MARKET', 'LIMIT', 'SL', 'SL-M'].map((ot) => (
                                                <label key={ot} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="orderType"
                                                        value={ot}
                                                        checked={orderType === ot}
                                                        onChange={() => setOrderType(ot as 'MARKET' | 'LIMIT' | 'SL' | 'SL-M')}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${orderType === ot
                                                        ? (isSell ? 'border-rose-600 bg-rose-600' : 'border-blue-600 bg-blue-600')
                                                        : 'border-gray-300 dark:border-[#363a45] group-hover:border-gray-400'
                                                        }`}>
                                                        {orderType === ot && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-tight ${orderType === ot ? 'text-gray-900 dark:text-[#d1d4dc]' : 'text-gray-400'
                                                        }`}>{ot}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SL Fields */}
                                    {(orderType === 'SL' || orderType === 'SL-M') && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="flex flex-col gap-2 overflow-hidden"
                                        >
                                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">Trigger Price</label>
                                            <input
                                                type="number"
                                                value={triggerPrice}
                                                onChange={(e) => setTriggerPrice(Number(e.target.value))}
                                                className="w-full bg-rose-500/5 dark:bg-rose-500/5 border border-rose-500/20 rounded-lg px-4 py-2.5 text-[14px] font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all text-rose-500 font-mono"
                                            />
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="bg-gray-50 dark:bg-black/20 p-5 space-y-4 border-t border-gray-100 dark:border-[#2a2e39]">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 uppercase tracking-widest leading-none mb-1">Margin Req.</span>
                                        <span className="text-gray-900 dark:text-[#d1d4dc] tabular-nums font-black text-[14px]">₹{(qty * (orderType === 'MARKET' ? ltp : price)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-gray-200 dark:border-[#2a2e39] pl-4">
                                        <span className="text-gray-400 uppercase tracking-widest leading-none mb-1">Available</span>
                                        <span className="text-emerald-500 tabular-nums font-black text-[14px]">₹{marginAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 p-1 px-2 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-tighter">
                                        <ShieldCheck size={12} /> Institutional Execution
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={isIndex}
                                onClick={() => {
                                    placeOrder({
                                        symbol,
                                        type,
                                        instrumentType,
                                        product,
                                        orderType,
                                        qty,
                                        price: orderType === 'MARKET' ? ltp : price,
                                    });
                                    closeOrderModal();
                                }}
                                className={`w-full py-4 rounded-xl text-[14px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isIndex
                                    ? 'bg-gray-200 dark:bg-[#363a45] text-gray-400 cursor-not-allowed'
                                    : (isSell
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20')
                                    }`}
                            >
                                <Zap size={18} fill="currentColor" />
                                {isIndex ? 'Market Restricted' : `${type} ${symbol}`}
                            </button>

                            <p className="text-[10px] text-gray-400 text-center font-bold tracking-tight opacity-60">
                                Orders are executed via NSE Exchange. MIS squared off by 3:20 PM.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
