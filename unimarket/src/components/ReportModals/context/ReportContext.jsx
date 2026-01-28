import React, { createContext, useContext, useState } from 'react';

const ReportContext = createContext(null);

export const ReportProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState({ targetType: 'Post', targetId: null });

  const openReport = (targetType, targetId) => {
    setTarget({ targetType, targetId });
    setIsOpen(true);
  };

  const closeReport = () => setIsOpen(false);

  return (
    <ReportContext.Provider value={{ isOpen, target, openReport, closeReport }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReportContext = () => {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    // Using context is optional; callers can fallback to local state if null
    return null;
  }
  return ctx;
};

export default ReportContext;
