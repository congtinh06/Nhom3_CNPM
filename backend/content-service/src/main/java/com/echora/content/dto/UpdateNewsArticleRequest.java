package com.echora.content.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNewsArticleRequest {

    @NotBlank(message = "Tiêu đề bài viết không được để trống")
    @Size(max = 300, message = "Tiêu đề bài viết tối đa 300 ký tự")
    private String title;

    @Pattern(
        regexp = "^$|^[a-z0-9]+(-[a-z0-9]+)*$",
        message = "Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang"
    )
    @Size(max = 180, message = "Slug tối đa 180 ký tự")
    private String slug;

    @NotBlank(message = "Chuyên mục không được để trống")
    private String category;

    @Size(max = 1000, message = "Tóm tắt tối đa 1000 ký tự")
    private String summary;

    private String content;

    @Size(max = 500, message = "URL ảnh tối đa 500 ký tự")
    private String coverImageUrl;

    @Size(max = 300, message = "Mô tả ảnh tối đa 300 ký tự")
    private String coverImageAlt;

    @Size(max = 200, message = "Nguồn ảnh tối đa 200 ký tự")
    private String imageCredit;

    @Size(max = 200, message = "Nguồn bài viết tối đa 200 ký tự")
    private String source;

    @Size(max = 500, message = "URL nguồn tối đa 500 ký tự")
    private String sourceUrl;

    @Size(max = 500, message = "URL bài viết gốc tối đa 500 ký tự")
    private String externalUrl;

    private List<String> tags;

    private List<String> relatedPoiSlugs;

    @Min(value = 1, message = "Thời gian đọc tối thiểu 1 phút")
    @Max(value = 120, message = "Thời gian đọc tối đa 120 phút")
    private Integer readingMinutes;

    @Size(max = 500, message = "URL audio tối đa 500 ký tự")
    private String audioUrl;

    private Boolean isActive;

    private Integer sortOrder;

    private LocalDateTime publishedAt;
}
