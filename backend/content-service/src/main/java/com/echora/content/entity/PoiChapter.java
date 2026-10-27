package com.echora.content.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "poi_chapter", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_poi_chapter_order", columnNames = {"poi_id", "chapter_order"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiChapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id", nullable = false)
    private Poi poi;

    @Column(name = "chapter_order", nullable = false)
    private Integer chapterOrder;

    // Tắt để ẩn chap khỏi du khách (nội dung đang soạn).
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PoiChapterTranslation> translations = new ArrayList<>();
}
