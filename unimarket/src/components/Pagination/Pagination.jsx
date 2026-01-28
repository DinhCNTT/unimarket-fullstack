import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.pagination}>
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className={styles.pageBtn}
      >
        &lt;
      </button>

      {pageNumbers.map(n => (
        <button 
          key={n} 
          onClick={() => onPageChange(n)} 
          className={`${styles.pageBtn} ${currentPage === n ? styles.active : ""}`}
        >
          {n}
        </button>
      ))}

      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className={styles.pageBtn}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;