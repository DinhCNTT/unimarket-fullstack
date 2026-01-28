import React, { useState, useRef, useEffect } from "react";
import styles from "./UniMarketIntro.module.css";

const UniMarketIntro = () => {
  const [expanded, setExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    // Kiểm tra chiều cao thực tế để quyết định hiện nút Xem thêm hay không
    if (contentRef.current) {
      // 220 là khớp với max-height của contentCollapsed trong CSS
      if (contentRef.current.scrollHeight > 220) {
        setShouldShowToggle(true);
      }
    }
  }, []);

  const toggleContent = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        UniMarket - Chợ Mua Bán, Rao Vặt Trực Tuyến Hàng Đầu Của Người Việt
      </h2>

      <div
        ref={contentRef}
        className={`${styles.contentWrapper} ${
          expanded ? styles.contentExpanded : styles.contentCollapsed
        }`}
      >
        <p className={styles.paragraph}>
          UniMarket chính thức gia nhập thị trường Việt Nam với mục đích tạo ra
          cho bạn một kênh rao vặt trung gian, kết nối người mua với người bán
          lại với nhau bằng những giao dịch cực kỳ đơn giản, tiện lợi, nhanh
          chóng, an toàn, mang đến hiệu quả bất ngờ.
        </p>

        <p className={styles.paragraph}>
          Đến nay, UniMarket tự hào là Website rao vặt được ưa chuộng hàng đầu.
          Hàng ngàn món hời từ Bất động sản, Nhà cửa, Xe cộ, Đồ điện tử, Thú
          cưng, Vật dụng cá nhân... đến tìm việc làm, thông tin tuyển dụng, các
          dịch vụ - du lịch được đăng tin, rao bán trên UniMarket.
        </p>

        <p className={styles.paragraph}>
          Với UniMarket, bạn có thể dễ dàng mua bán, trao đổi bất cứ một loại
          mặt hàng nào, dù đó là đồ cũ hay đồ mới với nhiều lĩnh vực:
        </p>

        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Bất động sản:</span> Cho thuê, Mua
            bán nhà đất, căn hộ chung cư, văn phòng mặt bằng kinh doanh, phòng
            trọ đa dạng về diện tích, vị trí.
          </li>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Phương tiện đi lại:</span> Mua bán
            ô tô, xe máy có độ bền cao, giá cả hợp lý, giấy tờ đầy đủ.
          </li>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Đồ dùng cá nhân:</span> Quần áo,
            giày dép, túi xách, đồng hồ... đa phong cách, hợp thời trang.
          </li>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Đồ điện tử:</span> Điện thoại di
            động, máy tính bảng, laptop, tivi, loa, amply...; đồ điện gia dụng:
            máy giặt, tủ lạnh, máy lạnh điều hòa... với rất nhiều nhãn hiệu,
            kích thước khác nhau.
          </li>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Vật nuôi, thú cưng:</span> Đa
            chủng loại: Gà, chó (chó phốc sóc, chó pug, chó poodle...), chim,
            mèo (mèo anh lông ngắn, mèo munchkin...), cá, hamster,... giá cực
            tốt.
          </li>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Tuyển dụng, việc làm:</span> Hàng
            triệu công việc hấp dẫn, phù hợp tại Việc Làm Tốt - Kênh tuyển dụng
            hiệu quả, uy tín được phát triển bởi UniMarket.
          </li>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Dịch vụ, du lịch:</span> Khách
            sạn, vé máy bay, vé tàu, vé xe, tour du lịch và các voucher du
            lịch... uy tín, chất lượng.
          </li>
          <li className={styles.listItem}>
            <span className={styles.boldText}>Đồ ăn, thực phẩm:</span> Các món
            ăn được chế biến thơm ngon, hấp dẫn, thực phẩm tươi sống, an toàn &
            giá cả hợp lý.
          </li>
        </ul>

        <p className={styles.paragraph}>
          Và còn rất nhiều mặt hàng khác nữa đã và đang được rao bán tại
          UniMarket.
        </p>

        <p className={styles.paragraph}>
          Mỗi người trong chúng ta đều có những sản phẩm đã qua sử dụng và không
          cần dùng tới nữa. Vậy còn chần chừ gì nữa mà không để nó trở nên giá
          trị hơn với người khác. Rất đơn giản, bạn chỉ cần chụp hình lại, mô tả
          cụ thể về sản phẩm và sử dụng ứng dụng Đăng tin miễn phí của UniMarket
          là đã có thể đến gần hơn với người cần nó.
        </p>

        <p className={styles.paragraph}>
          Không những thế, website unimarket.com còn cung cấp cho bạn thông tin
          về giá cả các mặt hàng để bạn có thể tham khảo. Đồng thời, thông qua
          Blog kinh nghiệm, UniMarket sẽ tư vấn, chia sẻ cho bạn những thông tin
          bổ ích, bí quyết, mẹo vặt giúp bạn có những giao dịch mua bán an toàn,
          đảm bảo. UniMarket cũng sẵn sàng hỗ trợ bạn trong mọi trường hợp cần
          thiết.
        </p>

        <p className={styles.paragraph}>
          Chúc các bạn có những trải nghiệm mua bán tuyệt vời trên UniMarket.
        </p>
      </div>

      {shouldShowToggle && (
        <button onClick={toggleContent} className={styles.toggleButton}>
          {expanded ? "Thu gọn" : "Mở rộng"}
        </button>
      )}
    </div>
  );
};

export default UniMarketIntro;