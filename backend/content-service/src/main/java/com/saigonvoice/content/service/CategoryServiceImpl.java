package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CategoryDto;
import com.saigonvoice.content.entity.Category;
import com.saigonvoice.content.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
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
