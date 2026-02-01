"use client";

import React from 'react';
import { X, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Order } from '@/types/terminal';

interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
    isOpen,
    onClose,
    orders
}) => {
    if (!isOpen) return null;

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'EXECUTED':
                return <CheckCircle size={14} className="text-emerald-500" />;
            case 'REJECTED':
                return <XCircle size={14} className="text-red-500" />;
            case 'CANCELLED':
                return <AlertCircle size={14} className="text-gray-400" />;
            case 'PENDING':
                return <Clock size={14} className="text-yellow-500" />;
        }
    };

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'EXECUTED':
                return 'text-emerald-500 bg-emerald-500/10';
            case 'REJECTED':
                return 'text-red-500 bg-red-500/10';
            case 'CANCELLED':
                return 'text-gray-500 bg-gray-500/10';
            case 'PENDING':
                return 'text-yellow-500 bg-yellow-500/10';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-elevated rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <h3 className="text-[14px] font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Order History ({orders.length})
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-surface-hover rounded transition-colors"
                    >
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Clock size={48} className="mb-4 opacity-20" />
                            <p className="text-[12px] font-bold uppercase">No orders yet</p>
                        </div>
                    ) : (
                        <div className="[&>*+*]:mt-0">
                            {orders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-surface-hover transition-colors">
                                    <div className="flex items-start justify-between">
                                        {/* Left: Order Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {order.type === 'BUY' ? (
                                                    <TrendingUp size={16} className="text-blue-500" />
                                                ) : (
                                                    <TrendingDown size={16} className="text-red-500" />
                                                )}
                                                <span className="text-[13px] font-black text-gray-900 dark:text-white">
                                                    {order.symbol}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[9px] font-black rounded ${order.type === 'BUY' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {order.type}
                                                </span>
                                                <span className="px-2 py-0.5 text-[9px] font-black rounded bg-gray-500/10 text-gray-500">
                                                    {order.product}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4 text-[11px]">
                                                <div>
                                                    <p className="text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Qty</p>
                                                    <p className="text-gray-900 dark:text-white font-black">{order.qty}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Price</p>
                                                    <p className="text-gray-900 dark:text-white font-black">₹{order.price.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Type</p>
                                                    <p className="text-gray-900 dark:text-white font-black">{order.orderType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Value</p>
                                                    <p className="text-gray-900 dark:text-white font-black">₹{(order.qty * order.price).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Status & Time */}
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="text-[10px] font-black uppercase">{order.status}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                                                {new Date(order.timestamp).toLocaleString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-surface-hover/50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2e39] rounded transition-colors uppercase"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
