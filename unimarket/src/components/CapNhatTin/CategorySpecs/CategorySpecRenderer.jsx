import React from "react";
import PhoneSpecs from "./PhoneSpecs";
// import LaptopSpecs from "./LaptopSpecs"; 

const CategorySpecRenderer = ({ categoryName, dynamicData, onDynamicChange, errors }) => {
  if (!categoryName) return null;

  // ✅ SỬA: Chuyển về string và lowercase để so sánh chính xác
  const name = categoryName.toString().toLowerCase();

  if (name.includes("điện thoại")) {
    return (
      <PhoneSpecs 
        data={dynamicData} 
        onChange={onDynamicChange} 
        errors={errors} 
      />
    );
  }
  return null;
};

export default CategorySpecRenderer;