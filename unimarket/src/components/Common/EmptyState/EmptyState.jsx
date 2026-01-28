import React from "react";
import styles from "./EmptyState.module.css";

const EmptyState = ({ icon, title, subtitle }) => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
};

export default EmptyState;