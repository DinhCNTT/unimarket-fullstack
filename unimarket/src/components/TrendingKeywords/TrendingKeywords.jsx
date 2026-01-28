import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TrendingKeywords.module.css';
import { viewHistoryService } from '../../services/viewHistoryService';

export default function TrendingKeywords() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingKeywords();
  }, []);

  const fetchTrendingKeywords = async () => {
    try {
      setLoading(false);
      const data = await viewHistoryService.getTrendingKeywords();
      setKeywords(data || []);
    } catch (err) {
      console.error('Error fetching trending keywords:', err);
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordClick = (keyword) => {
    navigate(`/search/${encodeURIComponent(keyword)}`);
  };

  // Return null if loading or no keywords to keep layout clean
  if (loading || !keywords || keywords.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>Các từ khóa phổ biến</h3>
      <ul className={styles.list}>
        {keywords.map((item, index) => (
          <li key={index} className={styles.item}>
            <a 
              href="#" 
              className={styles.link}
              onClick={(e) => {
                e.preventDefault();
                handleKeywordClick(item.keyword);
              }}
              title={`Tìm kiếm: ${item.keyword}`}
            >
              {item.keyword}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}