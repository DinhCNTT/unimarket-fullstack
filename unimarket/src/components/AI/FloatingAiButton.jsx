import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createAndOpenAiChat } from './AiHelpers';
import styles from '../../styles/floatingAiButton.module.css';

export default function FloatingAiButton({ user }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    createAndOpenAiChat({ user, navigate });
  };

  return (
    <button
      className={styles.umFloatingAiButton}
      aria-label="Uni.AI"
      data-title="Uni.AI"
      onClick={handleClick}
      title="Uni.AI"
    >
      {/* Avatar image - mascot */}
      <img src="/images/uni-ai-avatar.png" alt="Uni.AI" className={styles.umAiAvatar} />
      <span className={styles.srOnly}>Uni.AI</span>
    </button>
  );
}
