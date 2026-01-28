import React from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaRegCheckCircle } from "react-icons/fa";
import styles from "./InfoGrid.module.css";

const InfoGrid = ({ data }) => (
  <div className={styles.grid}>
    <div className={styles.item}>
      <FaRegCheckCircle className={styles.icon} />
      <span className={styles.value}>{data.tinhTrang}</span>
    </div>
    <div className={styles.item}>
      <FaMapMarkerAlt className={styles.icon} />
      <span className={styles.value}>
        {data.diaChi}, {data.quanHuyen}, {data.tinhThanh}
      </span>
    </div>
    <div className={styles.item}>
      <FaCalendarAlt className={styles.icon} />
      <span className={styles.value}>{data.ngayDang}</span>
    </div>
  </div>
);
export default InfoGrid;