import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Search, X } from 'lucide-react';
import nearbyPoisData from '../content/nearbyPois.json';
import { enrichProducts } from '../content/productAdapter';
import { defaultProducts } from '../content/defaultProducts';
import { api } from '../api/client';
import { Product } from '../types';
import { PriceRangeFilter, SortOptionKey } from '../types/productFilter';
import { useCart } from '../context/CartContext';
import { usePremium } from '../context/PremiumContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../hooks/useFavorites';
import { useProductFilters } from '../hooks/useProductFilters';
import { useNavbarLanguage } from '../content/languages';
import { SOUVENIR_SPOTS, getSpotName } from '../content/souvenirSpots';
import { st } from '../content/souvenirI18n';
import { formatPrice } from '../utils/formatters';
import { applySouvenirDiscount, isSouvenirDiscountEligible } from '../utils/pricing';
import '../styles/souvenir.css';

const ITEMS_PER_PAGE = 8;
const MAX_AUTOCOMPLETE_ITEMS = 6;

type CollectionKey = 'under-100k' | 'display' | 'pocket';
type ArtKind = 'frame' | 'model' | 'magnet' | 'card' | 'hat' | 'cup' | 'tea' | 'book';

/**
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu NFD, chuyển đ/Đ -> d, chữ thường)
 * để tìm kiếm cả có dấu lẫn không dấu.
 */
function normalizeVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Tô đậm phần khớp từ khóa trong tên sản phẩm trên dropdown gợi ý.
 */
function renderHighlightedName(name: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return name;

  const nfcName = name.normalize('NFC');
  const normName = nfcName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
  const normQuery = normalizeVietnamese(trimmed);
  if (!normQuery) return name;

  const matchIdx = normName.indexOf(normQuery);
  if (matchIdx === -1) return name;

  const prefix = nfcName.slice(0, matchIdx);
  const matched = nfcName.slice(matchIdx, matchIdx + normQuery.length);
  const suffix = nfcName.slice(matchIdx + normQuery.length);

  return (
    <>
      {prefix}
      <mark className="sr-hl">{matched}</mark>
      {suffix}
    </>
  );
}

/**
 * Xếp hạng độ liên quan 4 cấp cho live autocomplete (giữ nguyên logic từ FoodHeroSection):
 * 1: Tên bắt đầu bằng từ khóa
 * 2: Từ bất kỳ trong tên bắt đầu bằng từ khóa
 * 3: Tên chứa từ khóa
 * 4: Khớp tên điểm đến, mô tả ngắn hoặc mô tả chi tiết
 */
function getProductMatchRank(
  product: Product,
  normQuery: string,
  spotLabel: string
): number | null {
  if (!normQuery) return null;
  const normName = normalizeVietnamese(product.name);

  if (normName.startsWith(normQuery)) return 1;

  const words = normName.split(/\s+/);
  if (words.some((w) => w.startsWith(normQuery))) return 2;

  if (normName.includes(normQuery)) return 3;

  const normSpot = normalizeVietnamese(spotLabel);
  const normShort = normalizeVietnamese(product.shortDescription || '');
  const normDesc = normalizeVietnamese(product.description || '');

  if (
    normSpot.includes(normQuery) ||
    normShort.includes(normQuery) ||
    normDesc.includes(normQuery)
  ) {
    return 4;
  }

  return null;
}

function detectArtKind(product: Product): ArtKind {
  const hay = normalizeVietnamese(`${product.name} ${product.slug}`);
  if (hay.includes('mo hinh') || hay.includes('model')) return 'model';
  if (hay.includes('nam cham') || hay.includes('magnet')) return 'magnet';
  if (hay.includes('buu thiep') || hay.includes('postcard') || hay.includes('card')) return 'card';
  if (hay.includes('non la') || hay.includes('hat')) return 'hat';
  if (hay.includes('ca phe') || hay.includes('coffee') || hay.includes('phin')) return 'cup';
  if (hay.includes('tra ') || hay.startsWith('tra') || hay.includes('tea')) return 'tea';
  if (hay.includes('sach') || hay.includes('book')) return 'book';
  return 'frame';
}

const SouvenirLineArt: React.FC<{ kind: ArtKind }> = ({ kind }) => (
  <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <circle cx="262" cy="52" r="16" fill="var(--acc)" />
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      transform="translate(0 10)"
    >
      <path d="M20 160H300" opacity="0.45" />
      {kind === 'frame' && (
        <>
          <rect x="105" y="30" width="110" height="120" />
          <rect x="118" y="44" width="84" height="92" />
          <path d="M135 120l18-26 14 18 10-12 16 20" />
        </>
      )}
      {kind === 'model' && (
        <path d="M60 150V108H260V150M80 108V84H240V108M110 84V62H210V84M130 150v-24h60v24" />
      )}
      {kind === 'magnet' && (
        <>
          <circle cx="160" cy="92" r="44" />
          <path d="M132 100c0-22 56-22 56 0M144 100V72M176 100V72" />
        </>
      )}
      {kind === 'card' && (
        <>
          <rect x="80" y="52" width="160" height="96" rx="4" />
          <path d="M80 56l80 52 80-52M202 70h22v18h-22z" />
        </>
      )}
      {kind === 'hat' && (
        <path d="M60 124c40-6 70-20 100-80 30 60 60 74 100 80-40 16-160 16-200 0zM160 44v-12" />
      )}
      {kind === 'cup' && (
        <path d="M100 78h100v36c0 22-18 36-50 36s-50-14-50-36zM200 88h16a14 14 0 010 28h-16M130 60c-6-10 6-14 0-24M160 60c-6-10 6-14 0-24" />
      )}
      {kind === 'tea' && (
        <path d="M96 100h108v14c0 20-24 36-54 36s-54-16-54-36zM204 108h18a12 12 0 010 24h-14M96 100c0-12 20-22 54-22s54 10 54 22M150 78V66" />
      )}
      {kind === 'book' && <path d="M90 142h140V68H90zM90 105h140M112 142V68M128 86h80" />}
    </g>
  </svg>
);

const DISPLAY_KEYWORDS = [
  'tranh',
  'mo hinh',
  'sach',
  'tuong',
  'khung',
  'dia',
  'frame',
  'model',
  'book',
  'print',
];

const POCKET_KEYWORDS = [
  'nam cham',
  'buu thiep',
  'moc khoa',
  'huy hieu',
  'magnet',
  'postcard',
  'card',
  'keychain',
  'sticker',
  'bookmark',
];

function matchesCollection(product: Product, collection: CollectionKey, effectivePrice: number): boolean {
  if (collection === 'under-100k') {
    return effectivePrice <= 100000;
  }
  const hay = normalizeVietnamese(
    `${product.name} ${product.slug} ${product.shortDescription || ''}`
  );
  if (collection === 'display') {
    return DISPLAY_KEYWORDS.some((kw) => hay.includes(kw));
  }
  return POCKET_KEYWORDS.some((kw) => hay.includes(kw));
}

const staticPoiSlugById = new Map<string, string>(
  (nearbyPoisData as Array<{ id?: string; slug?: string }>)
    .filter((p) => p.id && p.slug)
    .map((p) => [String(p.id), String(p.slug)])
);

const SuggestionThumb: React.FC<{ product: Product }> = ({ product }) => {
  const [failed, setFailed] = useState(false);
  if (!product.imagePath || failed) {
    return (
      <span className="sr-sug-thumb is-art" aria-hidden="true">
        <SouvenirLineArt kind={detectArtKind(product)} />
      </span>
    );
  }
  return (
    <img
      src={product.imagePath}
      alt=""
      className="sr-sug-thumb"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

interface SouvenirGridCardProps {
  product: Product;
  index: number;
  isFavorited: boolean;
  effectivePrice: number;
  hasDiscount: boolean;
  lang: ReturnType<typeof useNavbarLanguage>['lang'];
  justAdded: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onQuickView: (product: Product) => void;
}

const SouvenirGridCard: React.FC<SouvenirGridCardProps> = ({
  product,
  index,
  isFavorited,
  effectivePrice,
  hasDiscount,
  lang,
  justAdded,
  onToggleFavorite,
  onAddToCart,
  onQuickView,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isOutOfStock = !product.isActive;
  const artKind = useMemo(() => detectArtKind(product), [product]);
  const hasSecondImage = Boolean(product.secondImagePath);

  const cardRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback cho môi trường không hỗ trợ (jsdom / trình duyệt cũ)
      setIsInView(true);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setIsInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className={`good ${isOutOfStock ? 'is-out' : ''} ${isInView ? 'is-in' : ''}`}
      style={{ '--d': `${Math.min(index, 11) * 60}ms` } as React.CSSProperties}
    >
      <div className="ph">
        {product.imagePath && !imageError ? (
          <>
            <img
              src={product.imagePath}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImageError(true)}
            />
            {hasSecondImage && (
              <img
                src={product.secondImagePath}
                alt=""
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgLoaded(true)}
                className="ph-ph"
              />
            )}
            {!imgLoaded && <div className="ph-skeleton" aria-hidden="true" />}
          </>
        ) : (
          <SouvenirLineArt kind={artKind} />
        )}

        <button
          type="button"
          className="open"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => onQuickView(product)}
        />

        <button
          type="button"
          className="heart"
          aria-pressed={isFavorited}
          aria-label={
            isFavorited
              ? st(lang, 'favRemoveAria', { name: product.name })
              : st(lang, 'favAddAria', { name: product.name })
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
          </svg>
        </button>

        {!isOutOfStock && (
          <div className="qa">
            <button
              type="button"
              className="qa-btn"
              style={{ '--qa-plus': justAdded ? '\u2713' : '+' } as React.CSSProperties}
              onClick={(e) => onAddToCart(product, e)}
            >
              <span className="qa-btn-label">{justAdded ? st(lang, 'addedOk') : st(lang, 'quickAdd')}</span>
            </button>
          </div>
        )}
      </div>

      <h3 className="good-name">
        <button type="button" className="ttl" onClick={() => onQuickView(product)}>
          {product.name}
        </button>
      </h3>

      <p className="good-dest">{getSpotName(product.poiSlug, lang)}</p>

      <p className="good-price">
        <b>{formatPrice(effectivePrice)}</b>
        {hasDiscount && <del className="old-price">{formatPrice(product.price)}</del>}
      </p>
    </article>
  );
};

export const FoodBeveragePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, openCart } = useCart();
  const { isPremium, hasAnyPurchase } = usePremium();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { lang } = useNavbarLanguage();

  const isDiscountEligible = isPremium || hasAnyPurchase;

  const {
    filters,
    handleSearch,
    handleChangeFilter,
    handleSortChange,
    handleResetFilters,
    handlePageChange,
    isAnyFilterActive,
  } = useProductFilters();

  const [searchInput, setSearchInput] = useState<string>(filters.keyword);
  const [ignoreSpotWhileTyping, setIgnoreSpotWhileTyping] = useState<boolean>(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [activeCollection, setActiveCollection] = useState<CollectionKey | null>(null);
  const [storyImgError, setStoryImgError] = useState<boolean>(false);

  // Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState<number>(1);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quickViewDialogRef = useRef<HTMLDialogElement>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const urlSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = useRef<boolean>(false);
  const catalogAnchorRef = useRef<HTMLDivElement>(null);

  // Nguồn dữ liệu: API/DB (nguồn chung với admin). Không tạo dữ liệu giả.
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chỉ đồng bộ từ URL về ô input khi người dùng KHÔNG đang gõ trong ô tìm kiếm
  // (tránh mất dấu cách hoặc nhảy con trỏ khi gõ tiếng Việt Unikey/EVKey).
  useEffect(() => {
    if (typeof document !== 'undefined' && document.activeElement === searchInputRef.current) {
      return;
    }
    setSearchInput(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    return () => {
      if (urlSyncTimerRef.current) {
        clearTimeout(urlSyncTimerRef.current);
      }
    };
  }, []);

  // Đóng dropdown gợi ý khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsAutocompleteOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cuộn mục đang chọn bằng bàn phím vào vùng nhìn thấy
  useEffect(() => {
    if (isAutocompleteOpen && highlightedIndex >= 0) {
      const el = document.getElementById(`souvenir-suggestion-${highlightedIndex}`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [isAutocompleteOpen, highlightedIndex]);

  useEffect(() => {
    document.title = st(lang, 'pageTitle');
  }, [lang]);

  useEffect(() => {
    if (typeof api.getProducts !== 'function') {
      setApiProducts([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    api
      .getProducts({ size: 200, sortBy: 'sortOrder' })
      .then((page) => {
        if (cancelled) return;
        setApiProducts(enrichProducts(page?.content ?? []));
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = defaultProducts.filter((p) => p.category === 'SOUVENIR');
        setApiProducts(fallback);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Trang chỉ hiển thị quà lưu niệm (SOUVENIR); món ăn/đồ uống đã bỏ.
  const souvenirProducts = useMemo(() => {
    const list = apiProducts ?? [];
    return list.filter((item) => item.category === 'SOUVENIR');
  }, [apiProducts]);

  // Đồng bộ từ khóa lên URL (có debounce để không gián đoạn gõ tiếng Việt)
  const commitKeywordToFilters = useCallback(
    (rawKeyword: string, resetSpot = true) => {
      setIgnoreSpotWhileTyping(false);
      const trimmed = rawKeyword.trim();
      if (resetSpot && trimmed && filters.spot !== 'all') {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('q', trimmed);
        nextParams.delete('spot');
        nextParams.delete('cat');
        nextParams.delete('type');
        nextParams.delete('page');
        setSearchParams(nextParams, { replace: true });
      } else {
        handleSearch(trimmed);
      }
    },
    [filters.spot, handleSearch, searchParams, setSearchParams]
  );

  const scheduleUrlKeywordSync = useCallback(
    (nextValue: string) => {
      if (urlSyncTimerRef.current) {
        clearTimeout(urlSyncTimerRef.current);
      }
      urlSyncTimerRef.current = setTimeout(() => {
        if (!isComposingRef.current) {
          commitKeywordToFilters(nextValue, true);
        }
      }, 280);
    },
    [commitKeywordToFilters]
  );

  // Live Autocomplete xếp hạng 4 cấp trên toàn bộ danh sách quà lưu niệm
  const autocompleteResult = useMemo(() => {
    const q = searchInput.trim();
    if (q.length < 1) {
      return { items: [] as Product[], totalMatches: 0 };
    }
    const normQ = normalizeVietnamese(q);
    if (!normQ) {
      return { items: [] as Product[], totalMatches: 0 };
    }

    const ranked: Array<{ product: Product; rank: number; index: number }> = [];
    souvenirProducts.forEach((product, index) => {
      if (!product.isActive) return;
      const spotLabel = product.poiSlug ? getSpotName(product.poiSlug, lang) : '';
      const rank = getProductMatchRank(product, normQ, spotLabel);
      if (rank !== null) {
        ranked.push({ product, rank, index });
      }
    });

    ranked.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.index - b.index));

    return {
      items: ranked.slice(0, MAX_AUTOCOMPLETE_ITEMS).map((r) => r.product),
      totalMatches: ranked.length,
    };
  }, [lang, searchInput, souvenirProducts]);

  // Reset số món đang mở mỗi khi đổi bộ lọc, từ khóa hoặc bộ sưu tập
  // (phân trang mặc định về trang 1 qua handlePageChange / handleChangeFilter)

  // Điểm vừa nghe gần nhất (đọc từ localStorage echora_listened_pois, chỉ hiện khi có quà thật)
  const recentListenedSpot = useMemo<{ slug: string; count: number } | null>(() => {
    if (typeof window === 'undefined' || souvenirProducts.length === 0) return null;
    try {
      const raw = localStorage.getItem('echora_listened_pois');
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return null;

      for (let idx = parsed.length - 1; idx >= 0; idx -= 1) {
        const entry = String(parsed[idx] ?? '').trim();
        if (!entry) continue;

        const mappedSlug = staticPoiSlugById.get(entry) ?? entry;
        const numericId = Number(entry);

        const matched = souvenirProducts.filter(
          (item) =>
            (item.poiSlug && item.poiSlug === mappedSlug) ||
            (!Number.isNaN(numericId) && item.poiId === numericId)
        );
        const resolvedSlug = matched[0]?.poiSlug;
        if (resolvedSlug && matched.length > 0) {
          return { slug: resolvedSlug, count: matched.length };
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [souvenirProducts]);

  // Danh sách tab điểm đến kèm số món thực tế
  const spotTabs = useMemo(() => {
    const countsBySlug = new Map<string, number>();
    souvenirProducts.forEach((item) => {
      if (item.poiSlug) {
        countsBySlug.set(item.poiSlug, (countsBySlug.get(item.poiSlug) ?? 0) + 1);
      }
    });

    const tabs = SOUVENIR_SPOTS.map((spot) => ({
      slug: spot.slug,
      label: getSpotName(spot.slug, lang),
      count: countsBySlug.get(spot.slug) ?? 0,
    }));

    countsBySlug.forEach((count, slug) => {
      if (!tabs.some((tab) => tab.slug === slug)) {
        tabs.push({
          slug,
          label: getSpotName(slug, lang),
          count,
        });
      }
    });

    return tabs;
  }, [souvenirProducts, lang]);

  const effectiveSpot = ignoreSpotWhileTyping ? 'all' : filters.spot;
  const effectiveKeyword = searchInput.trim();

  const filteredProducts = useMemo(() => {
    let list = [...souvenirProducts];

    // 1. Bộ sưu tập gợi ý nhanh (.col)
    if (activeCollection) {
      list = list.filter((item) => {
        const effPrice = applySouvenirDiscount(item.price, isDiscountEligible, item.category);
        return matchesCollection(item, activeCollection, effPrice);
      });
    }

    // 2. Từ khóa tìm kiếm (hỗ trợ cả có dấu, không dấu, tên điểm đến, mô tả)
    if (effectiveKeyword) {
      const normQ = normalizeVietnamese(effectiveKeyword);
      if (normQ) {
        list = list.filter((item) => {
          const spotLabel = item.poiSlug ? getSpotName(item.poiSlug, lang) : '';
          if (normalizeVietnamese(item.name).includes(normQ)) return true;
          if (spotLabel && normalizeVietnamese(spotLabel).includes(normQ)) return true;
          if (!filters.searchInDescription) return false;
          return (
            normalizeVietnamese(item.shortDescription || '').includes(normQ) ||
            normalizeVietnamese(item.description || '').includes(normQ)
          );
        });
      }
    }

    // 3. Điểm đến (.tabs)
    if (effectiveSpot !== 'all') {
      list = list.filter((item) => item.poiSlug === effectiveSpot);
    }

    // 4. Khoảng giá
    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'under-50k':
          list = list.filter((item) => item.price < 50000);
          break;
        case '50k-100k':
          list = list.filter((item) => item.price >= 50000 && item.price <= 100000);
          break;
        case '100k-200k':
          list = list.filter((item) => item.price > 100000 && item.price <= 200000);
          break;
        case 'above-200k':
          list = list.filter((item) => item.price > 200000);
          break;
      }
    }

    // 5. Đánh giá (tương thích URL query cũ nếu có)
    if (filters.rating !== 'all') {
      const minRating = Number(filters.rating);
      list = list.filter((item) => (item.rating || 5.0) >= minRating);
    }

    // 6. Sắp xếp
    switch (filters.sortBy) {
      case 'popular':
        list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case 'newest':
        list.sort((a, b) => b.id - a.id);
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return list;
  }, [
    activeCollection,
    effectiveKeyword,
    effectiveSpot,
    filters,
    isDiscountEligible,
    lang,
    souvenirProducts,
  ]);

  const currentPage = Math.max(1, filters.page);
  const visibleProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredProducts, currentPage]
  );

  // Sản phẩm cho đoạn editorial xen giữa các hàng của lưới (một ảnh khác với sản phẩm trong grid)
  const editorialProduct = useMemo<Product | null>(() => {
    if (filteredProducts.length === 0) return null;
    const visibleIds = new Set(visibleProducts.map((item) => item.id));
    const outsider = filteredProducts.find((item) => !visibleIds.has(item.id));
    const story = filteredProducts.find((item) => {
      const hay = normalizeVietnamese(`${item.name} ${item.slug}`);
      return hay.includes('tranh') || hay.includes('frame');
    });
    return outsider ?? story ?? filteredProducts[0] ?? null;
  }, [filteredProducts, visibleProducts]);

  // Danh sách số trang cho phân trang "Trước 1 2 3 4 5 Sau"
  const pageNumbers = useMemo(() => {
    const total = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    const start = Math.max(1, Math.min(currentPage - 2, total - 4));
    const end = Math.min(total, start + 4);
    const nums: number[] = [];
    for (let n = start; n <= end; n += 1) nums.push(n);
    return { nums, total };
  }, [currentPage, filteredProducts.length]);

  useEffect(() => {
    setStoryImgError(false);
  }, [editorialProduct?.id]);

  // Cuộn lên đầu lưới khi chuyển trang
  useEffect(() => {
    if (currentPage > 1) {
      catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const handleAddToCart = useCallback(
    (product: Product, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!product.isActive) return;
      addToCart(product, 1);
      showToast(st(lang, 'toastAdded', { name: product.name }));
      (window as unknown as { __pop?: () => void }).__pop?.();
    },
    [addToCart, lang, showToast]
  );

  // Quick add trên thẻ: "Thêm nhanh" -> "Đã thêm ✓" trong 1.5s
  const [justAddedId, setJustAddedId] = useState<number | null>(null);
  const justAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (justAddedTimerRef.current) {
        clearTimeout(justAddedTimerRef.current);
      }
    };
  }, []);

  const handleQuickAdd = useCallback(
    (product: Product, e?: React.MouseEvent) => {
      handleAddToCart(product, e);
      setJustAddedId(product.id);
      if (justAddedTimerRef.current) {
        clearTimeout(justAddedTimerRef.current);
      }
      justAddedTimerRef.current = setTimeout(() => setJustAddedId(null), 1500);
    },
    [handleAddToCart]
  );

  // Nút "Xem bộ sưu tập <điểm> →" của đoạn editorial: gộp bộ sưu tập về điểm đó rồi cuộn lên lưới
  const handleEditorialCta = useCallback(
    (poiSlug?: string | null) => {
      setActiveCollection(null);
      setIgnoreSpotWhileTyping(false);
      handleChangeFilter('spot', poiSlug ?? 'all');
      catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [handleChangeFilter]
  );

  const stopQuickViewAudio = useCallback(() => {
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    setIsAudioPlaying(false);
  }, []);

  const closeQuickView = useCallback(() => {
    stopQuickViewAudio();
    setAudioProgress(0);
    if (quickViewDialogRef.current?.open) {
      quickViewDialogRef.current.close();
    }
    setQuickViewProduct(null);
    setQuickViewQty(1);
  }, [stopQuickViewAudio]);

  const handleOpenDetailPage = useCallback(
    (product: Product) => {
      setIsAutocompleteOpen(false);
      setHighlightedIndex(-1);
      navigate(`/am-thuc/${product.slug}`);
    },
    [navigate]
  );

  const handleOpenQuickView = useCallback(
    (product: Product) => {
      setIsAutocompleteOpen(false);
      setHighlightedIndex(-1);
      stopQuickViewAudio();
      setAudioProgress(0);
      setQuickViewQty(1);
      setQuickViewProduct(product);
      setTimeout(() => {
        quickViewDialogRef.current?.showModal();
      }, 0);
    },
    [stopQuickViewAudio]
  );

  const handleSelectProduct = useCallback(
    (product: Product) => {
      handleOpenDetailPage(product);
    },
    [handleOpenDetailPage]
  );

  const handleToggleAudio = useCallback(() => {
    if (isAudioPlaying) {
      stopQuickViewAudio();
      return;
    }
    setIsAudioPlaying(true);
    audioTimerRef.current = setInterval(() => {
      setAudioProgress((prev) => {
        if (prev >= 100) {
          stopQuickViewAudio();
          return 0;
        }
        return prev + 2.5;
      });
    }, 1000);
  }, [isAudioPlaying, stopQuickViewAudio]);

  const handleQuickViewAddToCart = useCallback(() => {
    if (!quickViewProduct) return;
    addToCart(quickViewProduct, quickViewQty);
    showToast(st(lang, 'toastAdded', { name: quickViewProduct.name }));
    closeQuickView();
    openCart();
  }, [quickViewProduct, quickViewQty, addToCart, lang, showToast, closeQuickView, openCart]);

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
      }
    };
  }, []);

  const handleResetAll = useCallback(() => {
    if (urlSyncTimerRef.current) {
      clearTimeout(urlSyncTimerRef.current);
    }
    setActiveCollection(null);
    setIgnoreSpotWhileTyping(false);
    setSearchInput('');
    setIsAutocompleteOpen(false);
    setHighlightedIndex(-1);
    handleResetFilters();
  }, [handleResetFilters]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setHighlightedIndex(-1);

    if (val.trim().length >= 1) {
      // Khi khách chủ động gõ tìm kiếm mới, gỡ lọc bộ sưu tập / điểm đến cũ để không bị 0 kết quả
      if (activeCollection !== null) {
        setActiveCollection(null);
      }
      if (filters.spot !== 'all') {
        setIgnoreSpotWhileTyping(true);
      }
      setIsAutocompleteOpen(true);
    } else {
      setIgnoreSpotWhileTyping(false);
      setIsAutocompleteOpen(false);
    }

    scheduleUrlKeywordSync(val);
  };

  const handleClearSearch = () => {
    if (urlSyncTimerRef.current) {
      clearTimeout(urlSyncTimerRef.current);
    }
    setIgnoreSpotWhileTyping(false);
    setSearchInput('');
    setIsAutocompleteOpen(false);
    setHighlightedIndex(-1);
    handleSearch('');
    searchInputRef.current?.focus();
  };

  const handleQuickSuggest = useCallback(
    (term: string) => {
      if (urlSyncTimerRef.current) {
        clearTimeout(urlSyncTimerRef.current);
      }
      setActiveCollection(null);
      setSearchInput(term);
      setIsAutocompleteOpen(false);
      setHighlightedIndex(-1);
      commitKeywordToFilters(term, true);
    },
    [commitKeywordToFilters]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlSyncTimerRef.current) {
      clearTimeout(urlSyncTimerRef.current);
    }
    if (
      isAutocompleteOpen &&
      highlightedIndex >= 0 &&
      autocompleteResult.items[highlightedIndex]
    ) {
      handleSelectProduct(autocompleteResult.items[highlightedIndex]!);
      return;
    }
    setIsAutocompleteOpen(false);
    setHighlightedIndex(-1);
    commitKeywordToFilters(searchInput, true);
    catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = autocompleteResult.items;
    if (!isAutocompleteOpen) {
      if (e.key === 'ArrowDown' && searchInput.trim().length >= 1) {
        e.preventDefault();
        setIsAutocompleteOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsAutocompleteOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
    }
  };

  const toggleCollection = useCallback((col: CollectionKey) => {
    setActiveCollection((prev) => (prev === col ? null : col));
  }, []);

  const hasActiveFilterState =
    isAnyFilterActive || Boolean(effectiveKeyword) || activeCollection !== null;

  // Đoạn editorial xen giữa các hàng của lưới: chỉ khi chưa lọc và có dữ liệu
  const showEditorial =
    !isLoading && !hasActiveFilterState && Boolean(editorialProduct) && visibleProducts.length > 4;

  const showAutocompleteDropdown =
    isAutocompleteOpen && !isLoading && effectiveKeyword.length >= 1;

  const suggestions = useMemo(
    () => [
      st(lang, 'suggest1'),
      st(lang, 'suggest2'),
      st(lang, 'suggest3'),
      st(lang, 'suggest4'),
    ],
    [lang]
  );

  return (
    <div className="souvenir-sv-root">
      <div className="wrap">
        {/* 1. EDITORIAL HEADER + LIVE AUTOCOMPLETE SEARCH */}
        <section className="head">
          <div>
            <h1>{st(lang, 'heroTitle')}</h1>
            <p>{st(lang, 'heroSub')}</p>
            {recentListenedSpot && (
              <p className="hint">
                {st(lang, 'hintPrefix')} <b>{getSpotName(recentListenedSpot.slug, lang)}</b>.{' '}
                <button
                  type="button"
                  onClick={() => handleChangeFilter('spot', recentListenedSpot.slug)}
                >
                  {st(lang, 'hintAction', { count: recentListenedSpot.count })}
                </button>
              </p>
            )}
          </div>

          <div className="sr" ref={searchContainerRef}>
            <label htmlFor="souvenir-q">{st(lang, 'searchLabel')}</label>
            <div className="sr-combo-wrap">
              <form className="sr-form" role="search" onSubmit={handleSearchSubmit}>
              <div className="sr-box">
                <Search size={18} className="sr-icon" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  id="souvenir-q"
                  type="text"
                  value={searchInput}
                  placeholder={st(lang, 'searchPlaceholder')}
                  aria-label={st(lang, 'searchAria')}
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showAutocompleteDropdown}
                  aria-controls="souvenir-autocomplete-listbox"
                  aria-activedescendant={
                    showAutocompleteDropdown && highlightedIndex >= 0
                      ? `souvenir-suggestion-${highlightedIndex}`
                      : undefined
                  }
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={(e) => {
                    isComposingRef.current = false;
                    scheduleUrlKeywordSync(e.currentTarget.value);
                  }}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchInput.trim().length >= 1) {
                      setIsAutocompleteOpen(true);
                    }
                  }}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="sr-clear"
                    aria-label={st(lang, 'clearSearchAria')}
                    onClick={handleClearSearch}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
                <button type="submit" className="sr-submit">
                  {st(lang, 'searchBtn')}
                </button>
              </div>
            </form>

            {/* Live Autocomplete Dropdown (khôi phục từ FoodHeroSection, đồng bộ theme giấy kem + teal) */}
            {showAutocompleteDropdown && (
              <div
                id="souvenir-autocomplete-listbox"
                className="sr-dropdown"
                role="listbox"
                aria-label={st(lang, 'autocompleteAria')}
              >
                {autocompleteResult.items.length === 0 ? (
                  <div className="sr-dropdown-empty">
                    {st(lang, 'noAutocompleteMatch')}
                  </div>
                ) : (
                  <>
                    {autocompleteResult.items.map((item, idx) => {
                      const isHighlighted = highlightedIndex === idx;
                      const effPrice = applySouvenirDiscount(
                        item.price,
                        isDiscountEligible,
                        item.category
                      );
                      const spotLabel = item.poiSlug
                        ? getSpotName(item.poiSlug, lang)
                        : st(lang, 'defaultSpotLabel');
                      return (
                        <div
                          key={item.id}
                          id={`souvenir-suggestion-${idx}`}
                          role="option"
                          aria-selected={isHighlighted}
                          className={`sr-sug-row ${isHighlighted ? 'is-highlighted' : ''}`}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectProduct(item)}
                        >
                          <SuggestionThumb product={item} />
                          <div className="sr-sug-info">
                            <span className="sr-sug-name">
                              {renderHighlightedName(item.name, searchInput)}
                            </span>
                            <span className="sr-sug-spot">{spotLabel}</span>
                          </div>
                          <span className="sr-sug-price">{formatPrice(effPrice)}</span>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="sr-dropdown-all"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setIsAutocompleteOpen(false);
                        setHighlightedIndex(-1);
                        commitKeywordToFilters(searchInput, true);
                        catalogAnchorRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                    >
                      {st(lang, 'viewAllMatches', {
                        count: autocompleteResult.totalMatches,
                      })}
                    </button>
                  </>
                )}
              </div>
            )}
            </div>

            <small>
              {st(lang, 'suggestPrefix')}{' '}
              {suggestions.map((term, idx) => (
                <React.Fragment key={term}>
                  {idx > 0 && ', '}
                  <button type="button" onClick={() => handleQuickSuggest(term)}>
                    {term}
                  </button>
                </React.Fragment>
              ))}
            </small>
          </div>
        </section>

        {/* 2. (The recently listened stop hint now lives inside the editorial header above) */}

        {/* 3. CURATED COLLECTIONS (3 HAIRLINE COLUMNS) */}
        {souvenirProducts.length > 0 && (
          <div className="col" role="group" aria-label={st(lang, 'colGroupAria')}>
            <button
              type="button"
              aria-pressed={activeCollection === 'under-100k'}
              onClick={() => toggleCollection('under-100k')}
            >
              <b>{st(lang, 'col1Title')}</b>
              <span>{st(lang, 'col1Sub')}</span>
            </button>
            <button
              type="button"
              aria-pressed={activeCollection === 'display'}
              onClick={() => toggleCollection('display')}
            >
              <b>{st(lang, 'col2Title')}</b>
              <span>{st(lang, 'col2Sub')}</span>
            </button>
            <button
              type="button"
              aria-pressed={activeCollection === 'pocket'}
              onClick={() => toggleCollection('pocket')}
            >
              <b>{st(lang, 'col3Title')}</b>
              <span>{st(lang, 'col3Sub')}</span>
            </button>
          </div>
        )}

        {/* Catalog region: sticky tabs chỉ bám trong khu vực này */}
        <div className="catalog">
          {/* 4. STICKY DESTINATION STRIP */}
          <div className="tabs-w">
          <div className="tabs" role="radiogroup" aria-label={st(lang, 'spotGroupAria')}>
            <button
              type="button"
              role="radio"
              aria-checked={effectiveSpot === 'all'}
              onClick={() => {
                setIgnoreSpotWhileTyping(false);
                handleChangeFilter('spot', 'all');
              }}
            >
              {st(lang, 'spotAll')} <span className="n">{souvenirProducts.length}</span>
            </button>
            {spotTabs.map((spot) => {
              const isSelected = effectiveSpot === spot.slug;
              return (
                <button
                  key={spot.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setIgnoreSpotWhileTyping(false);
                    handleChangeFilter('spot', spot.slug);
                  }}
                >
                  {spot.label} <span className="n">{spot.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. INLINE TOOLS ROW (STATUS + HAIRLINE SELECTS) */}
        <div className="tools">
          <div className="tools-meta">
            <span id="souvenir-count" role="status">
              {isLoading
                ? st(lang, 'loading')
                : filteredProducts.length > 0
                  ? st(lang, 'showingRange', {
                      start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      end: Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length),
                      total: filteredProducts.length,
                    })
                  : st(lang, 'noItemsCount')}
            </span>
            {hasActiveFilterState && filteredProducts.length > 0 && (
              <button type="button" className="tools-reset" onClick={handleResetAll}>
                {st(lang, 'resetFilterInline')}
              </button>
            )}
          </div>

          <div className="tools-controls">
            <label className="sr-only" htmlFor="souvenir-pr">
              {st(lang, 'priceLabel')}
            </label>
            <select
              id="souvenir-pr"
              value={filters.priceRange}
              onChange={(e) =>
                handleChangeFilter('priceRange', e.target.value as PriceRangeFilter)
              }
            >
              <option value="all">{st(lang, 'priceAll')}</option>
              <option value="under-50k">{st(lang, 'priceUnder50')}</option>
              <option value="50k-100k">{st(lang, 'price50To100')}</option>
              <option value="100k-200k">{st(lang, 'price100To200')}</option>
              <option value="above-200k">{st(lang, 'priceAbove200')}</option>
            </select>

            <label className="sr-only" htmlFor="souvenir-so">
              {st(lang, 'sortLabel')}
            </label>
            <select
              id="souvenir-so"
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOptionKey)}
            >
              <option value="popular">{st(lang, 'sortPopular')}</option>
              <option value="newest">{st(lang, 'sortNewest')}</option>
              <option value="price-asc">{st(lang, 'sortPriceAsc')}</option>
              <option value="price-desc">{st(lang, 'sortPriceDesc')}</option>
            </select>
          </div>
        </div>

        {/* 6. PRODUCT GRID + LOAD MORE */}
        {isLoading ? (
          <div className="souvenir-loading" role="status">
            <RefreshCw size={22} className="souvenir-spin" aria-hidden="true" />
            <span>{st(lang, 'loading')}</span>
          </div>
        ) : visibleProducts.length > 0 ? (
          <>
            <div className="grid" id="grid" ref={catalogAnchorRef}>
              {visibleProducts.map((product, idx) => {
                const hasDiscount = isSouvenirDiscountEligible(
                  isDiscountEligible,
                  product.category
                );
                const effectivePrice = applySouvenirDiscount(
                  product.price,
                  isDiscountEligible,
                  product.category
                );

                if (showEditorial && idx === 3 && visibleProducts.length > 4) {
                  const editorial = editorialProduct;
                  if (editorial) {
                    return (
                      <div className="editorial" style={{ gridColumn: '1 / -1' }} key={`editorial-${editorial.id}`}>
                        <div className="ph editorial-ph">
                          {editorial.imagePath && !storyImgError ? (
                            <img
                              src={editorial.imagePath}
                              alt={editorial.name}
                              loading="lazy"
                              onError={() => setStoryImgError(true)}
                            />
                          ) : (
                            <SouvenirLineArt kind={detectArtKind(editorial)} />
                          )}
                        </div>
                        <div className="editorial-in">
                          <h2>{st(lang, 'editorialTitle')}</h2>
                          <p>{st(lang, 'editorialP1')}</p>
                          <p>{st(lang, 'editorialP2')}</p>
                          <button
                            type="button"
                            className="lnk"
                            onClick={() => handleEditorialCta(editorial.poiSlug)}
                          >
                            {st(lang, 'editorialCta', { name: getSpotName(editorial.poiSlug, lang) })}
                          </button>
                        </div>
                      </div>
                    );
                  }
                }

                return (
                  <SouvenirGridCard
                    key={product.id}
                    product={product}
                    index={idx}
                    isFavorited={isFavorite(product.id)}
                    effectivePrice={effectivePrice}
                    hasDiscount={hasDiscount}
                    lang={lang}
                    justAdded={justAddedId === product.id}
                    onToggleFavorite={toggleFavorite}
                    onAddToCart={handleQuickAdd}
                    onQuickView={handleOpenQuickView}
                  />
                );
              })}
            </div>

            <div className="pager" aria-label={st(lang, 'pagerLabel')}>
              <button
                type="button"
                className="pager-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                {st(lang, 'prevPage')}
              </button>
              {pageNumbers.nums.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pager-num ${n === currentPage ? 'is-current' : ''}`}
                  aria-current={n === currentPage ? 'page' : undefined}
                  onClick={() => handlePageChange(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="pager-btn"
                disabled={currentPage >= pageNumbers.total}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                {st(lang, 'nextPage')}
              </button>
            </div>
          </>
        ) : (
          <div className="grid">
            <div className="empty" role="status">
              {souvenirProducts.length > 0 ? (
                <>
                  {st(lang, 'emptyFiltered')}{' '}
                  <button type="button" onClick={handleResetAll}>
                    {st(lang, 'resetFilterInline')}
                  </button>
                </>
              ) : (
                st(lang, 'emptyCatalog')
              )}
            </div>
          </div>
        )}
        </div>

        {/* 7. EDITORIAL BLOCK: rendered between grid rows (full width, premium editorial) */}

        {/* 8. LOWER: CHỌN THEO ĐIỂM ĐÃ ĐI (hairline rows, no cards) */}
        {souvenirProducts.length > 0 && (
          <section className="desti" aria-labelledby="souvenirDestiTitle">
            <h2 id="souvenirDestiTitle">{st(lang, 'destiTitle')}</h2>
            <div className="desti-list">
              {spotTabs
                .filter((tab) => tab.count > 0)
                .map((tab) => (
                  <div className="desti-row" key={tab.slug}>
                    <div className="desti-row-main">
                      <h3>{tab.label}</h3>
                      <p>{st(lang, 'destiCount', { count: tab.count })}</p>
                    </div>
                    <button
                      type="button"
                      className="lnk"
                      onClick={() => handleEditorialCta(tab.slug)}
                    >
                      {st(lang, 'destiCta')}
                    </button>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* 9. LOWER: CÁCH CHỌN QUÀ (3 short columns) */}
        <section className="ways" aria-labelledby="souvenirWaysTitle">
          <h2 id="souvenirWaysTitle">{st(lang, 'waysTitle')}</h2>
          <div className="ways-grid">
            <div className="ways-col">
              <h3>{st(lang, 'waysDisplayTitle')}</h3>
              <p>{st(lang, 'waysDisplayP1')}</p>
              <p>{st(lang, 'waysDisplayP2')}</p>
            </div>
            <div className="ways-col">
              <h3>{st(lang, 'waysTravelTitle')}</h3>
              <p>{st(lang, 'waysTravelP1')}</p>
              <p>{st(lang, 'waysTravelP2')}</p>
            </div>
            <div className="ways-col">
              <h3>{st(lang, 'waysGiftTitle')}</h3>
              <p>{st(lang, 'waysGiftP1')}</p>
              <p>{st(lang, 'waysGiftP2')}</p>
            </div>
          </div>
        </section>

        {/* 10. LOWER: CHẤT LIỆU VÀ BẢO QUẢN / GIAO TIẾN / ĐỔI TRẢ (hairline columns) */}
        <section className="info">
          <div>
            <h3>{st(lang, 'info1Title')}</h3>
            <p>{st(lang, 'info1Desc')}</p>
          </div>
          <div>
            <h3>{st(lang, 'info2Title')}</h3>
            <p>{st(lang, 'info2Desc')}</p>
          </div>
          <div>
            <h3>{st(lang, 'info3Title')}</h3>
            <p>{st(lang, 'info3Desc')}</p>
          </div>
        </section>

        {/* 11. NATIVE <details>/<summary> FAQ (6 rows, min-height 52px, "+/–") */}
        <section className="faq" aria-labelledby="souvenirFaqTitle">
          <h2 id="souvenirFaqTitle">{st(lang, 'faqTitle')}</h2>
          <div>
            <details>
              <summary>{st(lang, 'faqQ1')}</summary>
              <p>{st(lang, 'faqA1')}</p>
            </details>
            <details>
              <summary>{st(lang, 'faqQ3')}</summary>
              <p>{st(lang, 'faqA3')}</p>
            </details>
            <details>
              <summary>{st(lang, 'faqQ4')}</summary>
              <p>{st(lang, 'faqA4')}</p>
            </details>
            <details>
              <summary>{st(lang, 'faqQ5')}</summary>
              <p>{st(lang, 'faqA5')}</p>
            </details>
            <details>
              <summary>{st(lang, 'faqQ6')}</summary>
              <p>{st(lang, 'faqA6')}</p>
            </details>
          </div>
        </section>

        {/* 12. CLOSING BLOCK: "Cần thêm cảm hứng trước khi chọn quà?" -> Đọc tin tức */}
        <section className="cta closing" aria-labelledby="souvenirClosingTitle">
          <div>
            <h2 id="souvenirClosingTitle">{st(lang, 'closingTitle')}</h2>
            <p>{st(lang, 'closingDesc')}</p>
          </div>
          <Link className="go" to="/tin-tuc">
            {st(lang, 'closingBtn')}
          </Link>
        </section>

        {/* 13. QUICK VIEW MODAL DIALOG (#qv) */}
        {quickViewProduct && (
          <dialog
            id="qv"
            ref={quickViewDialogRef}
            className="qv-dialog"
            aria-label={quickViewProduct.name}
            onClick={(e) => {
              if (e.target === quickViewDialogRef.current) {
                closeQuickView();
              }
            }}
            onCancel={(e) => {
              e.preventDefault();
              closeQuickView();
            }}
          >
            <div className="qv-in" id="qvi">
              <div className="ph">
                {quickViewProduct.imagePath ? (
                  <img src={quickViewProduct.imagePath} alt={quickViewProduct.name} />
                ) : (
                  <SouvenirLineArt kind={detectArtKind(quickViewProduct)} />
                )}
              </div>
              <div className="qi">
                <span className="m">
                  {quickViewProduct.poiSlug
                    ? getSpotName(quickViewProduct.poiSlug, lang)
                    : st(lang, 'defaultSpotLabel')}
                </span>
                <h2>{quickViewProduct.name}</h2>
                <p>{quickViewProduct.description || quickViewProduct.shortDescription}</p>
                <b className="pr">
                  <span>
                    {formatPrice(
                      applySouvenirDiscount(
                        quickViewProduct.price,
                        isDiscountEligible,
                        quickViewProduct.category
                      )
                    )}
                  </span>
                  {isDiscountEligible && (
                    <del>{formatPrice(quickViewProduct.price)}</del>
                  )}
                </b>

                <div className="aud">
                  <button
                    type="button"
                    className="pl"
                    id="qpl"
                    onClick={handleToggleAudio}
                  >
                    {isAudioPlaying
                      ? 'Tạm dừng'
                      : audioProgress > 0
                        ? 'Tiếp tục nghe'
                        : 'Nghe giới thiệu'}
                  </button>
                  <i>
                    <b id="qpb" style={{ width: `${audioProgress}%` }}></b>
                  </i>
                  <span>0:40</span>
                </div>

                <div className="qr">
                  <span className="stp">
                    <button
                      type="button"
                      disabled={quickViewQty <= 1}
                      onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                      aria-label="Giảm"
                    >
                      -
                    </button>
                    <span id="qn">{quickViewQty}</span>
                    <button
                      type="button"
                      onClick={() => setQuickViewQty((q) => q + 1)}
                      aria-label="Tăng"
                    >
                      +
                    </button>
                  </span>
                  <button
                    type="button"
                    className="go"
                    onClick={handleQuickViewAddToCart}
                  >
                    Thêm vào giỏ
                  </button>
                </div>

                {quickViewProduct.poiSlug && (
                  <Link
                    to={`/diem-du-lich?stop=${quickViewProduct.poiSlug}`}
                    className="lk"
                    onClick={closeQuickView}
                  >
                    {`Xem điểm dừng ${getSpotName(quickViewProduct.poiSlug, lang)}`}
                  </Link>
                )}
                <Link
                  to={`/am-thuc/${quickViewProduct.slug}`}
                  className="lk"
                  onClick={closeQuickView}
                >
                  Xem chi tiết sản phẩm
                </Link>
              </div>

              <button
                type="button"
                className="x"
                aria-label="Đóng"
                onClick={closeQuickView}
              >
                Đóng
              </button>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
};

export default FoodBeveragePage;
