import React, { useState } from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { SiMinutemailer } from "react-icons/si";
import styles from "./SellerSection.module.css";

const SellerSection = ({ data, user, onChatClick, isSelf }) => {
  const [showPhone, setShowPhone] = useState(false);
  const seller = data.nguoiDang;

  const formatPhone = (phone) => (showPhone ? phone : phone?.slice(0, 6) + "***");

  return (
    <div className={styles.container}>
      <h5 className={styles.title}>Thông tin người bán</h5>
      <div className={styles.info}>
        <img src={seller.avatarUrl} alt="avatar" className={styles.avatar} />
        <div className={styles.details}>
          <div className={styles.name}>{seller.fullName}</div>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.phone}`} onClick={() => setShowPhone(true)}>
          <FaPhoneAlt /> {formatPhone(seller.phoneNumber)}
        </button>

        {!isSelf && (
          <button
            className={`${styles.btn} ${styles.chat}`}
            onClick={onChatClick}
            title={!user ? "Bạn cần đăng nhập" : "Chat với người bán"}
          >
            <SiMinutemailer /> Chat
          </button>
        )}
      </div>
    </div>
  );
};
export default SellerSection;