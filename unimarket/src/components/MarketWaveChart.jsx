import React, { useMemo } from 'react';
import {
  ComposedChart, // Dùng loại này để vẽ cả Cột lẫn Đường
  Bar,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, BarChart3, Clock } from 'lucide-react';
import { formatPrice } from '../utils/formatters'; 
import styles from './MarketWaveChart.module.css';

const MarketWaveChart = ({ data }) => {
  if (!data || !data.histogramData) return null;

  const { currentPrice, status, differencePercent, sampleSize, histogramData } = data;

  // 1. Logic "AI Insight": Dự đoán khả năng thanh khoản
  const marketInsight = useMemo(() => {
    if (status === "Rẻ hơn thị trường") return { 
        text: "Dễ bán cực nhanh", 
        color: "#10b981", 
        icon: Zap,
        sub: "Dự kiến bay màu trong 24h"
    };
    if (status === "Cao hơn thị trường") return { 
        text: "Kén người mua", 
        color: "#f59e0b", 
        icon: Clock,
        sub: "Có thể mất >7 ngày để bán"
    };
    return { 
        text: "Thanh khoản tốt", 
        color: "#3b82f6", 
        icon: TrendingUp,
        sub: "Dự kiến bán trong 2-3 ngày"
    };
  }, [status]);

  const InsightIcon = marketInsight.icon;

  // 2. Xử lý dữ liệu cho ComposedChart
  const chartData = useMemo(() => {
    return histogramData.map((bucket, index) => {
      let isUserPrice = currentPrice >= bucket.min && currentPrice < bucket.max;
      if (index === histogramData.length - 1 && currentPrice >= bucket.min) isUserPrice = true;

      return {
        ...bucket,
        // Tạo dữ liệu giả lập cho đường cong (Curve) dựa trên chiều cao cột
        // Thêm chút random hoặc smoothing nếu muốn, ở đây lấy chính count để vẽ đỉnh núi
        curveValue: bucket.count, 
        rangeLabel: `${formatPrice(bucket.min)} - ${formatPrice(bucket.max)}`,
        tickLabel: bucket.min >= 1000000 ? `${(bucket.min/1000000).toFixed(1)}` : bucket.min,
        isUserPrice: isUserPrice
      };
    });
  }, [histogramData, currentPrice]);

  // Tooltip xịn sò
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      // payload[0] là Area, payload[1] là Bar (tùy thứ tự vẽ)
      // Ta tìm cái nào có data thật
      const item = payload.find(p => p.payload.min)?.payload; 
      if (!item) return null;

      return (
        <div className={styles.customTooltip}>
          <div className={styles.tooltipHeader}>
             KHOẢNG GIÁ PHỔ BIẾN
          </div>
          <div className={styles.tooltipPrice}>
            {formatPrice(item.min)} - {formatPrice(item.max)}
          </div>
          <div className={styles.tooltipBody}>
            <div className={styles.tooltipRow}>
               <span style={{color: '#6b7280'}}>Số lượng:</span>
               <strong>{item.count} tin đăng</strong>
            </div>
            {item.isUserPrice && (
                <div className={styles.tooltipPulseBadge}>
                    <span className={styles.pulseDot}></span>
                    Bạn đang ở đây
                </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Label trên đỉnh cột
  const renderCustomBarLabel = (props) => {
    const { x, y, width, value, index } = props;
    const isUserPrice = chartData[index].isUserPrice;
    if (value === 0) return null;
    
    // Nếu là cột của User -> Vẽ Icon thay vì số, hoặc vẽ cả hai
    if (isUserPrice) {
        return (
            <g>
                <circle cx={x + width/2} cy={y - 12} r="3" fill={marketInsight.color} className={styles.radarPing} />
                <text x={x + width / 2} y={y - 20} fill={marketInsight.color} textAnchor="middle" fontSize={12} fontWeight={700}>
                    Tôi
                </text>
            </g>
        );
    }

    return (
      <text x={x + width / 2} y={y - 5} fill="#9ca3af" textAnchor="middle" fontSize={11} fontWeight={500}>
        {value}
      </text>
    );
  };

  return (
    <div className={styles.chartContainer}>
      {/* --- HEADER CAO CẤP --- */}
      <div className={styles.header}>
        <div className={styles.leftInfo}>
           <div className={styles.mainStat}>
              <span className={styles.bigPrice}>{differencePercent > 0 ? '+' : ''}{differencePercent}%</span>
              <span className={styles.statLabel}>so với thị trường</span>
           </div>
           <div className={styles.subStat}>
              Dữ liệu từ {sampleSize} tin đăng (iPhone 14 PM)
           </div>
        </div>
        
        {/* Insight Badge */}
        <div className={styles.insightBox} style={{ '--theme-color': marketInsight.color }}>
            <div className={styles.insightHeader}>
                <InsightIcon size={14} />
                <span>{marketInsight.text}</span>
            </div>
            <div className={styles.insightSub}>{marketInsight.sub}</div>
        </div>
      </div>

      {/* --- HYBRID CHART AREA --- */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {/* Gradient cho Area (Đường cong nền) */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              {/* Gradient cho Cột của User */}
              <linearGradient id="userBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={marketInsight.color} stopOpacity={1}/>
                <stop offset="100%" stopColor={marketInsight.color} stopOpacity={0.6}/>
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="tickLabel" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
              dy={10}
              unit="tr"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />

            {/* 1. Lớp Nền: Area Chart (Đường cong mềm mại) */}
            <Area 
                type="monotone" 
                dataKey="curveValue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeOpacity={0.3}
                fill="url(#areaGradient)" 
                activeDot={false}
                animationDuration={1500}
            />

            {/* 2. Lớp Chính: Bar Chart */}
            <Bar dataKey="count" barSize={32} radius={[6, 6, 6, 6]} animationDuration={1000}>
              <LabelList dataKey="count" content={renderCustomBarLabel} />
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Nếu là cột User -> Dùng gradient màu theme. Cột khác -> Xám nhạt
                  fill={entry.isUserPrice ? `url(#userBarGradient)` : '#f3f4f6'} 
                  // Nếu không phải User, làm mờ đi để nổi bật User
                  opacity={entry.isUserPrice ? 1 : 1}
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                />
              ))}
            </Bar>

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MarketWaveChart;