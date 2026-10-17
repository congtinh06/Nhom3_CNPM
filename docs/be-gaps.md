# Backend API Gaps Analysis vs Frontend Plan (F1)

This document lists every backend field that is missing, structured differently, or unclear between the current backend API implementation and the Echora frontend plan:

- **Endpoint `GET /api/content/pois` and `GET /api/content/pois/:slug` - Cover Image Structure**:
  - Current BE: Returns `thumbnailUrl: string` (flat URL string).
  - Plan Schema: Expects `cover: { url: string, alt?: string }`.
  - Proposed BE Field: Add `coverAlt?: string` or nested object `cover: { url: string, alt?: string }`.
  - FE Mitigation: Adapter constructs `{ url: dto.thumbnailUrl, alt: dto.name }`.

- **Endpoint `GET /api/content/pois` and `GET /api/content/pois/:slug` - Trigger Radius Naming**:
  - Current BE: Returns `triggerRadiusMeters: number`.
  - Plan Schema: Expects `radiusM: number`.
  - Proposed BE Field: Provide `radiusM` alias or standardize on `triggerRadiusMeters`.
  - FE Mitigation: Adapter maps `dto.triggerRadiusMeters ?? 40`.

- **Endpoint `GET /api/content/pois/:slug` - Audio Duration Naming**:
  - Current BE: Returns `audioDurationSeconds: number`.
  - Plan Schema: Expects `audioDurationSec?: number`.
  - Proposed BE Field: Standardize field name to `audioDurationSec`.
  - FE Mitigation: Adapter maps `dto.audioDurationSeconds` -> `audioDurationSec`.

- **Endpoint `GET /api/content/pois/:slug` - Structured Transcript / Body Sections**:
  - Current BE: Returns flat string `description: string` without paragraph time offsets.
  - Plan Schema: Expects `body: Array<{ heading?: string, text: string, startSec?: number }>`.
  - Proposed BE Field: Add `body: Array<{ heading?: string, text: string, startSec?: number }>` to support synchronized audio transcript tracking.
  - FE Mitigation: Adapter wraps flat `description` into `[{ text: description }]`.

- **Endpoint `GET /api/content/pois/:slug` - Practical Information**:
  - Current BE: Only returns `address: string`. Lacks hours, ticket pricing, and visitor guidelines.
  - Plan Schema: Expects `practicalInfo: { hours?: string, ticket?: string, notes?: string, address?: string }`.
  - Proposed BE Field: Add `openingHours?: string`, `ticketPrice?: string`, and `visitNotes?: string` to POI detail response.
  - FE Mitigation: Adapter maps available `address`, leaving optional fields undefined.

- **Endpoint `GET /api/content/pois` - Route Information & Languages List**:
  - Current BE: `GET /api/content/pois` returns `List<PoiSummaryDto>`. It does not return total duration, route distance, or available languages array.
  - Plan Schema: Expects `RouteInfo { title: string, totalDurationMin?: number, distanceKm?: number, languages: Array<{ code: string, label: string }>, stops: Stop[] }`.
  - Proposed BE Field: Wrap POI list response with `{ title, totalDurationMin, distanceKm, languages, stops }` or expose route summary metadata.
  - FE Mitigation: Adapter wraps array into RouteInfo with fallback title and default languages `[{ code: 'vi', label: 'Tiếng Việt' }, { code: 'en', label: 'English' }]`.
