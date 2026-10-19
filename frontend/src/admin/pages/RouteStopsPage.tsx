import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  GripVertical,
  MapPin,
  Pencil,
  RefreshCw,
  Route as RouteIcon,
  Search,
  X,
} from 'lucide-react';
import { routeApi } from '../api/routeApi';
import { zoneApi } from '../api/zoneApi';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminRouteDetail, AdminRouteListItem, AdminRouteStop } from '../types/route';
import { AdminZoneListItem } from '../types/zone';
import { AdminPoiListItem } from '../types/poi';
import { AdminAlert } from '../components/AdminAlert';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { normalizeSearchText } from '../utils/text';

export const RouteStopsPage: React.FC = () => {
  const [routes, setRoutes] = useState<AdminRouteListItem[]>([]);
  const [zones, setZones] = useState<AdminZoneListItem[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const [routeSearch, setRouteSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminRouteDetail | null>(null);
  const [stops, setStops] = useState<AdminRouteStop[]>([]);
  const [serverStops, setServerStops] = useState<AdminRouteStop[]>([]);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const [zonePois, setZonePois] = useState<AdminPoiListItem[]>([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [pickerValue, setPickerValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const [pendingRouteId, setPendingRouteId] = useState<number | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const pendingRouteRef = useRef<number | null>(null);

  const loadRouteList = useCallback(async () => {
    setRoutesLoading(true);
    setRoutesError(null);
    try {
      const result = await routeApi.getAdminRoutes({ page: 0, size: 200 });
      setRoutes(result?.content || []);
    } catch (err) {
      setRoutesError(normalizeAdminError(err).message);
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRouteList();
    zoneApi
      .getAdminZones({ page: 0, size: 200 })
      .then((res) => setZones(res?.content || []))
      .catch(() => setZones([]));
  }, [loadRouteList]);

  useEffect(() => {
    if (selectedRouteId === null && routes.length > 0) {
      setSelectedRouteId(routes[0]?.id ?? null);
    }
  }, [routes, selectedRouteId]);

  const loadRouteDetail = useCallback(async (routeId: number) => {
    setEditorLoading(true);
    setEditorError(null);
    setSaveError(null);
    setNotice(null);
    setPickerValue('');
    try {
      const loaded = await routeApi.getAdminRouteDetail(routeId);
      const loadedStops = loaded.stops || [];
      setDetail(loaded);
      setStops(loadedStops);
      setServerStops(loadedStops);

      setPoisLoading(true);
      try {
        const pois = await poiApi.getAdminPois({ zoneId: loaded.zoneId, size: 200 });
        setZonePois(pois?.content || []);
      } catch {
        setZonePois([]);
      } finally {
        setPoisLoading(false);
      }
    } catch (err) {
      setEditorError(normalizeAdminError(err).message);
      setDetail(null);
      setStops([]);
      setServerStops([]);
      setZonePois([]);
    } finally {
      setEditorLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRouteId !== null) {
      loadRouteDetail(selectedRouteId);
    }
  }, [selectedRouteId, loadRouteDetail]);

  const stopIds = (list: AdminRouteStop[]) => list.map((stop) => stop.id);
  const isDirty =
    detail !== null &&
    JSON.stringify(stopIds(stops)) !== JSON.stringify(stopIds(serverStops));

  const filteredRoutes = useMemo(() => {
    const query = normalizeSearchText(routeSearch);
    return routes.filter((route) => {
      if (zoneFilter && String(route.zoneId) !== zoneFilter) return false;
      if (statusFilter && route.status !== statusFilter) return false;
      if (!query) return true;
      return normalizeSearchText(
        `${route.name} ${route.zoneName} ${route.zoneCode}`
      ).includes(query);
    });
  }, [routes, routeSearch, zoneFilter, statusFilter]);

  const availablePois = useMemo(
    () => zonePois.filter((poi) => !stops.some((stop) => stop.id === poi.id)),
    [zonePois, stops]
  );

  const hasRouteFilters = Boolean(routeSearch.trim() || zoneFilter || statusFilter);

  const resetRouteFilters = () => {
    setRouteSearch('');
    setZoneFilter('');
    setStatusFilter('');
  };

  const requestSelectRoute = (routeId: number) => {
    if (routeId === selectedRouteId) return;
    if (isDirty) {
      pendingRouteRef.current = routeId;
      setPendingRouteId(routeId);
      return;
    }
    setSelectedRouteId(routeId);
  };

  const confirmLeaveRoute = () => {
    const nextRouteId = pendingRouteRef.current;
    setPendingRouteId(null);
    pendingRouteRef.current = null;
    if (nextRouteId !== null) {
      setSelectedRouteId(nextRouteId);
    }
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    setStops((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const item = prev[index];
      if (!item) return prev;
      const next = [...prev];
      next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
    setNotice(null);
    setSaveError(null);
  };

  const removeStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    setNotice(null);
    setSaveError(null);
  };

  const moveStopTo = (from: number, to: number) => {
    if (from === to) return;
    setStops((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      if (!item) return prev;
      next.splice(to, 0, item);
      return next;
    });
    setNotice(null);
    setSaveError(null);
  };

  const handleAddStop = () => {
    if (!pickerValue) return;
    const poiId = parseInt(pickerValue, 10);
    const poi = zonePois.find((item) => item.id === poiId);
    if (!poi || stops.some((stop) => stop.id === poiId)) return;
    setStops((prev) => [...prev, { id: poi.id, code: poi.code, name: poi.name }]);
    setPickerValue('');
    setNotice(null);
    setSaveError(null);
  };

  const handleResetStops = () => {
    setStops(serverStops);
    setPickerValue('');
    setNotice(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedRouteId || !detail || saving || !isDirty) return;
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      const result = await routeApi.updateStops(selectedRouteId, {
        poiIds: stopIds(stops),
        version: detail.version ?? 0,
      });
      const savedStops = result.stops || [];
      setStops(savedStops);
      setServerStops(savedStops);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              stops: savedStops,
              stopCount: savedStops.length,
              version: result.version ?? prev.version,
            }
          : prev
      );
      setRoutes((prev) =>
        prev.map((route) =>
          route.id === selectedRouteId
            ? { ...route, stopCount: savedStops.length }
            : route
        )
      );
      setNotice('Đã lưu thứ tự điểm dừng cho tuyến.');
    } catch (err) {
      const norm = normalizeAdminError(err);
      if (norm.status === 409) {
        setShowConflictDialog(true);
      } else {
        setSaveError(norm.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-page adm-stops-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Thứ tự điểm dừng</h1>
          <p className="adm-page-desc">
            Chọn một tuyến, sắp xếp lại các điểm thuyết minh theo đúng lộ trình tham quan
            thực tế rồi lưu thay đổi.
          </p>
        </div>
        <div className="adm-page-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={loadRouteList}
            disabled={routesLoading}
          >
            <RefreshCw aria-hidden="true" />
            {routesLoading ? 'Đang tải...' : 'Làm mới danh sách'}
          </button>
        </div>
      </div>

      <div className="adm-stops-layout">
        <aside className="adm-card adm-stops-routes" aria-label="Danh sách tuyến">
          <div className="adm-card-head-row">
            <div>
              <h2 className="adm-card-title">Chọn tuyến</h2>
              <p className="adm-card-subtitle">Lọc nhanh để tìm tuyến cần sắp xếp.</p>
            </div>
            <span className="adm-badge adm-badge-neutral">
              {filteredRoutes.length}/{routes.length}
            </span>
          </div>

          <div className="adm-stops-route-search">
            <Search aria-hidden="true" />
            <input
              type="search"
              className="adm-input"
              placeholder="Tìm tuyến hoặc khu vực"
              value={routeSearch}
              onChange={(e) => setRouteSearch(e.target.value)}
              aria-label="Tìm tuyến để sắp xếp điểm dừng"
            />
            {routeSearch && (
              <button
                type="button"
                className="adm-stops-route-search-clear"
                onClick={() => setRouteSearch('')}
                aria-label="Xóa từ khóa tìm tuyến"
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="adm-stops-route-filters">
            <select
              className="adm-select"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              aria-label="Lọc tuyến theo khu vực"
            >
              <option value="">Tất cả khu vực</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
            <select
              className="adm-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc tuyến theo trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm ngưng</option>
            </select>
          </div>

          {hasRouteFilters && (
            <button
              type="button"
              className="adm-btn adm-btn-ghost adm-btn-sm adm-stops-reset-filter"
              onClick={resetRouteFilters}
            >
              Xóa bộ lọc tuyến
            </button>
          )}

          {routesError ? (
            <ErrorState
              title="Không thể tải danh sách tuyến"
              message={routesError}
              onRetry={loadRouteList}
            />
          ) : routesLoading ? (
            <div className="adm-stops-route-loading" role="status">
              Đang tải danh sách tuyến...
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="adm-stops-route-empty">
              Không có tuyến nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <ul className="adm-stops-route-list">
              {filteredRoutes.map((route) => {
                const isSelected = route.id === selectedRouteId;
                return (
                  <li key={route.id}>
                    <button
                      type="button"
                      className={`adm-stops-route-item${isSelected ? ' is-selected' : ''}`}
                      onClick={() => requestSelectRoute(route.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="adm-stops-route-item-main">
                        <span className="adm-stops-route-item-name">{route.name}</span>
                        <span className="adm-stops-route-item-zone">
                          <MapPin aria-hidden="true" />
                          {route.zoneName}
                        </span>
                      </span>
                      <span className="adm-stops-route-item-meta">
                        <span className="adm-stops-route-item-count">
                          {route.stopCount} điểm
                        </span>
                        <StatusBadge status={route.status} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="adm-card adm-stops-editor" aria-label="Sắp xếp điểm dừng">
          {editorLoading ? (
            <div className="adm-stops-editor-loading" role="status">
              <span className="adm-spinner" aria-hidden="true" />
              Đang tải điểm dừng của tuyến...
            </div>
          ) : editorError ? (
            <ErrorState
              title="Không thể tải tuyến"
              message={editorError}
              onRetry={() => selectedRouteId && loadRouteDetail(selectedRouteId)}
            />
          ) : !detail ? (
            <EmptyState
              title="Chưa chọn tuyến"
              description="Chọn một tuyến ở danh sách bên trái để xem và sắp xếp thứ tự điểm dừng."
            />
          ) : (
            <>
              <div className="adm-stops-editor-head">
                <div className="adm-stops-editor-title">
                  <span className="adm-stops-editor-eyebrow">
                    <RouteIcon aria-hidden="true" />
                    Lộ trình tuyến
                  </span>
                  <h2 className="adm-card-title">{detail.name}</h2>
                  <p className="adm-stops-editor-subtitle">
                    <MapPin aria-hidden="true" />
                    {detail.zoneName} ({detail.zoneCode})
                    <span className="adm-stops-dot" aria-hidden="true" />
                    {stops.length} điểm dừng
                  </p>
                </div>
                <div className="adm-stops-editor-actions">
                  <StatusBadge status={detail.status} />
                  <Link
                    to={`/quan-tri/lo-trinh/${detail.id}`}
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                  >
                    <Pencil aria-hidden="true" />
                    Sửa thông tin tuyến
                  </Link>
                </div>
              </div>

              {notice && (
                <AdminAlert variant="success" message={notice} onClose={() => setNotice(null)} />
              )}
              {saveError && (
                <AdminAlert variant="danger" message={saveError} onClose={() => setSaveError(null)} />
              )}
              {isDirty && (
                <div className="adm-stops-dirty-banner" role="status">
                  <AlertCircle aria-hidden="true" />
                  Thứ tự điểm dừng đã thay đổi nhưng chưa được lưu.
                </div>
              )}

              {stops.length === 0 ? (
                <div className="adm-stops-empty">
                  Tuyến chưa có điểm dừng nào. Thêm điểm thuyết minh bên dưới để bắt đầu
                  sắp xếp lộ trình.
                </div>
              ) : (
                <ol className="adm-stops-list adm-stops-list-large" aria-label="Thứ tự điểm dừng">
                  {stops.map((stop, index) => (
                    <li
                      key={stop.id}
                      className={`adm-stop-item${
                        draggingIndex === index ? ' is-dragging' : ''
                      }`}
                      onDragOver={(e) => {
                        if (draggingIndex === null || saving) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingIndex !== null) {
                          moveStopTo(draggingIndex, index);
                        }
                        setDraggingIndex(null);
                      }}
                    >
                      <span
                        className="adm-stop-drag"
                        draggable={!saving}
                        onDragStart={(e) => {
                          setDraggingIndex(index);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(stop.id));
                        }}
                        onDragEnd={() => setDraggingIndex(null)}
                        title="Kéo để thay đổi thứ tự"
                        aria-hidden="true"
                      >
                        <GripVertical />
                      </span>
                      <span className="adm-stop-order" aria-hidden="true">
                        {index + 1}
                      </span>
                      <div className="adm-stop-info">
                        <span className="adm-stop-name">{stop.name}</span>
                        <span className="adm-stop-code">{stop.code}</span>
                      </div>
                      <div className="adm-stop-actions">
                        <button
                          type="button"
                          className="adm-btn adm-btn-ghost adm-btn-sm adm-stop-btn"
                          onClick={() => moveStop(index, -1)}
                          disabled={index === 0 || saving}
                          aria-label={`Di chuyển ${stop.name} lên trên`}
                        >
                          <ArrowUp aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn-ghost adm-btn-sm adm-stop-btn"
                          onClick={() => moveStop(index, 1)}
                          disabled={index === stops.length - 1 || saving}
                          aria-label={`Di chuyển ${stop.name} xuống dưới`}
                        >
                          <ArrowDown aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn-danger-ghost adm-btn-sm adm-stop-btn"
                          onClick={() => removeStop(index)}
                          disabled={saving}
                          aria-label={`Gỡ ${stop.name} khỏi tuyến`}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <div className="adm-stop-add adm-stops-add-large">
                <label className="adm-form-label" htmlFor="routeStopsPicker">
                  Thêm điểm dừng
                </label>
                <div className="adm-stop-add-row">
                  <select
                    id="routeStopsPicker"
                    className="adm-select"
                    value={pickerValue}
                    onChange={(e) => setPickerValue(e.target.value)}
                    disabled={poisLoading || saving || availablePois.length === 0}
                  >
                    <option value="">
                      {poisLoading
                        ? 'Đang tải điểm thuyết minh...'
                        : availablePois.length === 0
                        ? 'Không còn điểm nào khả dụng'
                        : '-- Chọn điểm thuyết minh --'}
                    </option>
                    {availablePois.map((poi) => (
                      <option key={poi.id} value={poi.id}>
                        {poi.name} ({poi.code})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    onClick={handleAddStop}
                    disabled={!pickerValue || saving}
                  >
                    + Thêm
                  </button>
                </div>
                <p className="adm-form-hint">
                  Chỉ hiển thị điểm thuyết minh thuộc khu vực {detail.zoneName} và chưa có
                  trong tuyến.
                </p>
              </div>

              <div className="adm-stops-editor-footer">
                <span className="adm-stops-save-state">
                  {isDirty ? 'Có thay đổi chưa lưu' : 'Mọi thay đổi đã được lưu'}
                </span>
                <div className="adm-stops-footer-actions">
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary"
                    onClick={handleResetStops}
                    disabled={!isDirty || saving}
                  >
                    Hoàn tác
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn-primary"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                  >
                    {saving ? 'Đang lưu thứ tự...' : 'Lưu thứ tự điểm dừng'}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={pendingRouteId !== null}
        title="Chuyển tuyến khi chưa lưu?"
        message="Bạn đang có thay đổi thứ tự điểm dừng chưa lưu. Nếu chuyển sang tuyến khác, các thay đổi này sẽ bị mất."
        confirmText="Chuyển tuyến"
        cancelText="Ở lại tuyến này"
        variant="danger"
        onConfirm={confirmLeaveRoute}
        onCancel={() => {
          setPendingRouteId(null);
          pendingRouteRef.current = null;
        }}
      />

      <ConfirmDialog
        isOpen={showConflictDialog}
        title="Dữ liệu đã thay đổi"
        message="Tuyến đã được người khác cập nhật. Vui lòng tải lại để xem thứ tự mới nhất trước khi lưu."
        confirmText="Tải lại"
        cancelText="Tiếp tục chỉnh sửa"
        onConfirm={() => {
          setShowConflictDialog(false);
          if (selectedRouteId !== null) {
            loadRouteDetail(selectedRouteId);
          }
        }}
        onCancel={() => setShowConflictDialog(false)}
      />
    </div>
  );
};

export default RouteStopsPage;
