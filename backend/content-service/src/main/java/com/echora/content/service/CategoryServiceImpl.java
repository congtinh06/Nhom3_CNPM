package com.echora.content.service;

import com.echora.content.dto.CategoryDto;
import com.echora.content.entity.Category;
import com.echora.content.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private CategoryDto mapToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .code(category.getCode())
                .nameVi(category.getNameVi())
                .nameEn(category.getNameEn())
                .iconUrl(category.getIconUrl())
                .build();
    }
}
