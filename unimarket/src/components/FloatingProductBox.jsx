import React, { useState, useEffect, useRef } from "react";
import "./FloatingProductBox.css";
import ReportButton from "./ReportModals/ReportButton";


const FloatingProductBox = ({ image, title, price, details, description, onShowPhone, onChat, showPhone, phoneMasked, phone, currentUserId, sellerId, targetId }) => {
  // Visual guide Y (px from top of viewport) for tuning scroll-spy
  const GUIDE_Y = 200; // adjust as needed while tuning; temporary visual aid

  const [tab, setTab] = useState('overview');
  const [activeTab, setActiveTab] = useState('overview');
  const [guideDescTop, setGuideDescTop] = useState(GUIDE_Y);
  const [guideSimilarTop, setGuideSimilarTop] = useState(GUIDE_Y + 200);
  // Local phone visibility fallback when parent doesn't manage it
  const [localShowPhone, setLocalShowPhone] = useState(false);
  const ignoreScrollUntilRef = useRef(0); // timestamp to ignore scroll updates (ms)

  useEffect(() => {
    // Find potential scroll container (if the app uses an inner scroll area)
    const findScrollContainer = () => {
      const selectors = ['.um-tn-tab-content', '.app-content', '.main-content', '.page-content'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    };

    const container = findScrollContainer();

    // Helper: compute element top relative to viewport or relative to a scroll container's viewport
    const getRelativeTop = (el, containerEl) => {
      if (!el) return Infinity;
      const rect = el.getBoundingClientRect();
      if (containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        return rect.top - containerRect.top; // distance from top of container's visible area
      }
      return rect.top; // distance from top of viewport
    };

    const handleScrollGeneric = () => {
      if (Date.now() < ignoreScrollUntilRef.current) return; // ignore during programmatic scroll

      const overviewEl = document.getElementById('tong-quan');
      const descEl = document.getElementById('mo-ta-chi-tiet');
      // Prefer the heading node inside the similar wrapper; if not found, fall back to wrapper itself
      const similarHeading = document.querySelector('#tin-dang-tuong-tu h2') || document.querySelector('#cac-tin-dang-khac h2') || document.getElementById('tin-dang-tuong-tu') || document.getElementById('cac-tin-dang-khac');

      const overviewThreshold = 180; // for overview
      const descThreshold = 260; // fallback threshold for desc
      const similarThreshold = 120; // highlight 'Tin đăng tương tự' a bit later

      // Compute floating bar height and landing Y values (match click scroll targets)
      const floatingEl = document.querySelector('.floating-product-box');
      const floatingH = floatingEl ? floatingEl.getBoundingClientRect().height : 144;
      const descLandingY = floatingH + 8; // where description heading will sit after clicking 'desc'
      const similarExtra = 360; // extra used previously so floatingH + similarExtra ~= 510
      const similarLandingY = floatingH + similarExtra; // where similar heading will sit after clicking 'similar'

      // Update guide line positions (only when changed to avoid extra re-renders)
      if (Math.abs((guideDescTop || 0) - descLandingY) > 1) setGuideDescTop(descLandingY);
      if (Math.abs((guideSimilarTop || 0) - similarLandingY) > 1) setGuideSimilarTop(similarLandingY);

      // Get bounding rects relative to viewport or container
      const getRects = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        if (container) {
          const cRect = container.getBoundingClientRect();
          return {
            top: rect.top - cRect.top,
            bottom: rect.bottom - cRect.top,
            height: rect.height,
            rect,
            containerRect: cRect
          };
        }
        return { top: rect.top, bottom: rect.bottom, height: rect.height, rect };
      };

      const o = getRects(overviewEl);
      const d = getRects(descEl);
      const s = getRects(similarHeading);

      // Helper to compute visible pixels and ratio of an element inside viewport/container
      const computeVisibility = (rectObj) => {
        if (!rectObj || !rectObj.rect) return { visiblePx: 0, ratio: 0 };
        const rect = rectObj.rect;
        const viewportTop = container ? container.getBoundingClientRect().top : 0;
        const viewportBottom = container ? container.getBoundingClientRect().bottom : window.innerHeight;
        const top = rect.top;
        const bottom = rect.bottom;
        const visibleTop = Math.max(top, viewportTop);
        const visibleBottom = Math.min(bottom, viewportBottom);
        const visiblePx = Math.max(0, visibleBottom - visibleTop);
        const ratio = rect.height > 0 ? visiblePx / rect.height : 0;
        return { visiblePx, ratio };
      };

      const oVis = computeVisibility(o);
      const dVis = computeVisibility(d);
      const sVis = computeVisibility(s);

      // Determine active tab. Preference: similar > desc > overview (deeper wins)
      let currentTab = 'overview';

      // Debug log (include landing lines)
      try {
        console.debug('[FPB] positions', {
          overviewTop: o && (o.rect ? o.rect.top : o.top),
          descTop: d && (d.rect ? d.rect.top : d.top),
          similarTop: s && (s.rect ? s.rect.top : s.top),
          oVis, dVis, sVis,
          viewportHeight: container ? container.getBoundingClientRect().height : window.innerHeight,
          floatingH,
          descLandingY,
          similarLandingY,
          GUIDE_Y
        });
      } catch (e) {}

      // Decide active tab based on where headings would land when clicked
      // Priority: similar > desc > overview
      const oTop = o ? (o.rect ? o.rect.top : o.top) : Infinity;
      const dTop = d ? (d.rect ? d.rect.top : d.top) : Infinity;
      const sTop = s ? (s.rect ? s.rect.top : s.top) : Infinity;

      // Trigger exactly when headings reach their landing lines (match click landing)
      if (s && sTop <= similarLandingY) {
        currentTab = 'similar';
      } else if (d && dTop <= descLandingY) {
        currentTab = 'desc';
      } else if (o && (oVis.ratio >= 0.15 || oTop <= 120)) {
        currentTab = 'overview';
      } else {
        currentTab = 'overview';
      }

      if (currentTab !== activeTab) {
        try { console.debug('[FPB] activeTab ->', currentTab); } catch (e) {}
        setActiveTab(currentTab);
      }
    };

    if (container) {
      const boundHandler = () => handleScrollGeneric();
      container.addEventListener('scroll', boundHandler);
      // Run once to initialise
      boundHandler();
      return () => container.removeEventListener('scroll', boundHandler);
    }

    window.addEventListener('scroll', handleScrollGeneric);
    handleScrollGeneric();
    return () => window.removeEventListener('scroll', handleScrollGeneric);
  }, []);

  const handleTab = (type) => {
    setTab(type);
    setActiveTab(type); // phản hồi UI ngay lập tức
    // Ignore scroll-driven updates for a short period while programmatic scroll runs
    ignoreScrollUntilRef.current = Date.now() + 700;
    if(type === 'overview') {
      const el = document.getElementById('tong-quan');
      if(el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 144;
        // Try to scroll any likely scroll container first
        const container = document.querySelector('.um-tn-tab-content') || document.querySelector('.app-content') || null;
        if (container && typeof container.scrollTo === 'function') {
          const top = el.offsetTop - 144;
          container.scrollTo({ top, behavior: 'smooth' });
        } else {
          window.scrollTo({top: y, behavior: 'smooth'});
        }
      } else {
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    }
    if(type === 'desc') {
      const el = document.getElementById('mo-ta-chi-tiet');
      if(el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 144;
        const container = document.querySelector('.um-tn-tab-content') || document.querySelector('.app-content') || null;
        if (container && typeof container.scrollTo === 'function') {
          const top = el.offsetTop - 144;
          container.scrollTo({ top, behavior: 'smooth' });
        } else {
          window.scrollTo({top: y, behavior: 'smooth'});
        }
      }
    }
    if(type === 'similar') {
      const el = document.getElementById('tin-dang-tuong-tu');
      if(el) {
        // Larger offset for similar section (buttons / controls above)
        const y = el.getBoundingClientRect().top + window.scrollY - 510;
        const container = document.querySelector('.um-tn-tab-content') || document.querySelector('.app-content') || null;
        if (container && typeof container.scrollTo === 'function') {
          const top = el.offsetTop - 510;
          container.scrollTo({ top, behavior: 'smooth' });
        } else {
          window.scrollTo({top: y, behavior: 'smooth'});
        }
      }
    }
  };

  return (
    <div className="floating-product-box">
      {/* guide line removed */}
      <div className="fpb-content">
        <img src={image} alt={title} className="fpb-image" width={48} height={48} />
        <div className="fpb-info">
          <span className="fpb-title">{title}</span>
          <div className="fpb-price-details">
            <span className="fpb-price">
              {typeof price === 'string' 
                ? price.replace(/,/g, '.').replace('VND', 'đ') 
                : price}
            </span>
          </div>
        </div>
        <div className="fpb-actions">
          {/* Phone button: prefer parent-managed `showPhone`/`onShowPhone`, otherwise use local state */}
          <button
            className="fpb-btn fpb-btn-phone"
            onClick={() => {
              if (typeof onShowPhone === 'function') {
                try { onShowPhone(); } catch (e) { console.warn('onShowPhone error', e); }
              } else {
                setLocalShowPhone((s) => !s);
              }
            }}
          >
            {(() => {
              const effectiveShow = (typeof showPhone === 'boolean' ? showPhone : localShowPhone);
              return effectiveShow ? (phone || phoneMasked) : `Hiện số ${phoneMasked}`;
            })()}
          </button>
          {currentUserId !== sellerId && (
          <>
            <ReportButton targetType="Post" targetId={targetId} className="fpb-btn fpb-btn-report" />
            <button className="fpb-btn fpb-btn-chat" onClick={onChat}>
              <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.0994 11.9996C21.0992 7.25016 17.2483 3.40002 12.4988 3.40002C7.74944 3.40024 3.89938 7.2503 3.89917 11.9996C3.89917 16.7492 7.74931 20.6 12.4988 20.6002C14.0297 20.6002 15.4646 20.2007 16.7078 19.5016L16.7927 19.4586C16.9954 19.3688 17.2234 19.3489 17.4402 19.403L20.9001 20.2672L20.2937 16.0192C20.2673 15.8339 20.2932 15.6445 20.3689 15.4733C20.8379 14.4123 21.0994 13.2377 21.0994 11.9996ZM13.0994 12.1998L13.2009 12.2047C13.7054 12.2557 14.0993 12.682 14.0994 13.1998C14.0994 13.7178 13.7054 14.144 13.2009 14.1949L13.0994 14.1998H8.89917C8.34689 14.1998 7.89917 13.7521 7.89917 13.1998C7.89927 12.6476 8.34695 12.1998 8.89917 12.1998H13.0994ZM16.0994 7.40002L16.2009 7.40491C16.7054 7.45588 17.0994 7.88208 17.0994 8.40002C17.0994 8.91796 16.7054 9.34417 16.2009 9.39514L16.0994 9.40002H8.89917C8.34689 9.40002 7.89917 8.95231 7.89917 8.40002C7.89917 7.84774 8.34689 7.40002 8.89917 7.40002H16.0994ZM23.0994 11.9996C23.0994 13.4158 22.8169 14.7681 22.3113 16.0055L23.0906 21.4576C23.1377 21.7872 23.0175 22.1184 22.7703 22.3414C22.523 22.5643 22.1811 22.6497 21.8582 22.569L17.3289 21.4362C15.8794 22.1794 14.2369 22.6002 12.4988 22.6002C6.64474 22.6 1.89917 17.8537 1.89917 11.9996C1.89938 6.14573 6.64487 1.40024 12.4988 1.40002C18.3529 1.40002 23.0992 6.1456 23.0994 11.9996Z" fill="#222222"></path></svg>
              Chat
            </button>
          </>
          )}
        </div>
      </div>
  {/* ...existing code... */}
      <div className="fpb-tabs">
        <div className="fpb-tabs-inner">
          <button className={activeTab==='overview'?"fpb-tab active":"fpb-tab"} onClick={()=>handleTab('overview')}>Tổng quan</button>
          <button className={activeTab==='desc'?"fpb-tab active":"fpb-tab"} onClick={()=>handleTab('desc')}>Mô tả</button>
          <button className={activeTab==='similar'?"fpb-tab active":"fpb-tab"} onClick={()=>handleTab('similar')}>Tin đăng tương tự</button>
        </div>
      </div>
    </div>
  );
};

export default FloatingProductBox;
