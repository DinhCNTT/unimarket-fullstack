// File: src/components/SocialChatViewer/MessageActions.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Reply, MoreHorizontal, Trash2 } from 'lucide-react';
import './MessageActions.css'
// Hook để bắt click bên ngoài
const useOutsideClick = (ref, callback) => {
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [ref, callback]);
};

const MessageActions = ({ message, isSender, onStartReply, onOpenDeleteModal }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useOutsideClick(menuRef, () => setIsMenuOpen(false));

    if (message.isRecalled) return null; // Không hiển thị action cho tin đã thu hồi

    return (
        <div className={`message-actions-hover ${isSender ? 'sent' : 'received'}`}>
            <button className="action-icon-btn" onClick={() => onStartReply(message)} title="Trả lời">
                <Reply size={18} />
            </button>
            
            <div className="action-menu-container" ref={menuRef}>
                <button className="action-icon-btn" onClick={() => setIsMenuOpen(prev => !prev)} title="Thêm">
                    <MoreHorizontal size={18} />
                </button>
                
                {isMenuOpen && (
                    <div className="action-menu-dropdown">
                        <button 
                            className="action-menu-item"
                            onClick={() => {
                                onOpenDeleteModal(message);
                                setIsMenuOpen(false);
                            }}
                        >
                            <Trash2 size={16} />
                            <span>{isSender ? "Thu hồi" : "Gỡ"}</span>
                        </button>
                        {/* (Thêm các item khác như "Copy" ở đây) */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageActions;
