import React from "react";
import { IoClose } from "react-icons/io5";
import styles from "./PanelHeader.module.css";

const PanelHeader = ({ onClose }) => (
  <div className={styles.header}>
    <h3>Chi tiết tin đăng</h3>
    <IoClose size={28} className={styles.closeBtn} onClick={onClose} />
  </div>
);
export default PanelHeader;