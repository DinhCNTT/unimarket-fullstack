import React, { createContext, useState } from 'react';

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState(""); // Danh mục cha
  const [selectedSubCategory, setSelectedSubCategory] = useState(""); // Danh mục con

  return (
    <CategoryContext.Provider value={{ 
      selectedCategory, 
      setSelectedCategory,
      selectedSubCategory,
      setSelectedSubCategory 
    }}>
      {children}
    </CategoryContext.Provider>
  );
};