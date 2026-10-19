package com.saigonvoice.content.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsListResponse {
    private List<NewsArticleDto> items;
    private long total;
    private String announcement;
}
