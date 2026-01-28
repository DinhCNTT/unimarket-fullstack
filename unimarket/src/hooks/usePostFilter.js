// src/hooks/usePostFilter.js
import { useMemo } from 'react';

export const usePostFilter = ({
  posts,
  contextCity,
  contextDistrict,
  selectedCategory,
  selectedSubCategory,
  selectedDistrict,
  minPrice,
  maxPrice,
  advancedFilters,
  searchTerm,
  sortOrder
}) => {
  return useMemo(() => {
    let result = [...posts];

    // 1. Lọc Location
    if (contextCity) {
      result = result.filter(p => p.tinhThanh === contextCity);
    }

    // 2. Lọc Category
    if (selectedSubCategory) {
       result = result.filter(p => p.danhMuc && p.danhMuc.toLowerCase().includes(selectedSubCategory.toLowerCase()));
    } else if (selectedCategory) {
       result = result.filter(p => p.danhMucCha && p.danhMucCha.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    // 3. Lọc District
    const targetDistrict = selectedDistrict || contextDistrict;
    if (targetDistrict) {
      result = result.filter(p => p.quanHuyen && p.quanHuyen.trim() === targetDistrict.trim());
    }

    // 4. Lọc GIÁ
    const effectiveMin = (advancedFilters.minPrice !== undefined && advancedFilters.minPrice !== null) ? advancedFilters.minPrice : minPrice;
    const effectiveMax = (advancedFilters.maxPrice !== undefined && advancedFilters.maxPrice !== null) ? advancedFilters.maxPrice : maxPrice;

    result = result.filter(p => {
        const price = Number(p.gia);
        if (effectiveMin > 0 && price < effectiveMin) return false;
        if (effectiveMax > 0 && price > effectiveMax) return false;
        return true;
    });

    // 5. Lọc Nâng cao (Dynamic Logic)
    if (Object.keys(advancedFilters).length > 0) {
        result = result.filter(post => {
            const details = post.ChiTietObj || {};
            
            return Object.entries(advancedFilters).every(([filterKey, filterValue]) => {
                if (['minPrice', 'maxPrice', 'TinhTrang'].includes(filterKey)) return true;
                if (!filterValue) return true;

                const valFilter = String(filterValue).toLowerCase().trim();
                const dbKey = Object.keys(details).find(k => k.toLowerCase() === filterKey.toLowerCase());

                if (dbKey) {
                    const valDB = String(details[dbKey]).toLowerCase();
                    return valDB.includes(valFilter);
                }

                if (filterKey === 'Hang') {
                    return (post.tieuDe || "").toLowerCase().includes(valFilter);
                }
                return false;
            });
        });

        // Xử lý riêng TinhTrang (Bảo hành / SQL TinhTrang)
        if (advancedFilters.TinhTrang) {
            const filterVal = advancedFilters.TinhTrang.toLowerCase().trim();
            result = result.filter(post => {
                const dbBaoHanh = (post.ChiTietObj?.BaoHanh || post.ChiTietObj?.baoHanh || "").toLowerCase();
                const sqlTinhTrang = (post.TinhTrang || "").toLowerCase();
                
                let isMatch = false;
                if (filterVal.includes("bảo hành") && (dbBaoHanh.includes("còn") || dbBaoHanh.includes("yes") || dbBaoHanh.includes("có"))) isMatch = true;
                if (dbBaoHanh.includes(filterVal)) isMatch = true;
                if (sqlTinhTrang.includes(filterVal)) isMatch = true;
                
                return isMatch;
            });
        }
    }

    // 6. Search Text
    if (searchTerm) {
      result = result.filter(p => p.tieuDe && p.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 7. Sort
    return result.sort((a, b) => {
       const dateA = new Date(a.ngayDang);
       const dateB = new Date(b.ngayDang);
       return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  }, [posts, contextCity, contextDistrict, selectedCategory, selectedSubCategory, selectedDistrict, minPrice, maxPrice, advancedFilters, searchTerm, sortOrder]);
};