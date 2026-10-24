package com.echora.content.service;

import com.echora.content.dto.CategoryDto;
import com.echora.content.entity.Category;
import com.echora.content.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryDto> getAllCategories() {
        List<Category> all = categoryRepository.findAll();
        Map<Long, CategoryDto> dtoMap = new LinkedHashMap<>();

        for (Category cat : all) {
            dtoMap.put(cat.getId(), mapToDto(cat));
        }

        List<CategoryDto> rootCategories = new ArrayList<>();
        for (Category cat : all) {
            CategoryDto dto = dtoMap.get(cat.getId());
            if (cat.getParent() != null && dtoMap.containsKey(cat.getParent().getId())) {
                dtoMap.get(cat.getParent().getId()).getChildren().add(dto);
            } else {
                rootCategories.add(dto);
            }
        }

        return rootCategories;
    }

    private CategoryDto mapToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .nameVi(category.getNameVi())
                .nameEn(category.getNameEn())
                .iconUrl(category.getIconUrl())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .children(new ArrayList<>())
                .build();
    }
}
