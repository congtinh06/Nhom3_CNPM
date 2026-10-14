import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable, Column } from '../admin/components/DataTable';

interface TestItem {
  id: number;
  name: string;
  count: number;
}

const TEST_COLUMNS: Column<TestItem>[] = [
  { key: 'id', title: 'Mã' },
  { key: 'name', title: 'Tên địa điểm', render: (item) => <strong>{item.name}</strong> },
  { key: 'count', title: 'Số lượt', align: 'right' },
];

const TEST_DATA: TestItem[] = [
  { id: 1, name: 'Dinh Độc Lập', count: 1250 },
  { id: 2, name: 'Nhà thờ Đức Bà', count: 980 },
];

describe('DataTable', () => {
  it('hiển thị đầy đủ tiêu đề cột và các dòng dữ liệu', () => {
    render(
      <DataTable
        columns={TEST_COLUMNS}
        data={TEST_DATA}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'Mã' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tên địa điểm' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Số lượt' })).toBeInTheDocument();

    expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    expect(screen.getByText('980')).toBeInTheDocument();
  });

  it('hiển thị skeleton khi trạng thái loading = true', () => {
    const { container } = render(
      <DataTable
        columns={TEST_COLUMNS}
        data={[]}
        keyExtractor={(item) => item.id}
        loading={true}
      />
    );

    const skeletonRows = container.querySelectorAll('.adm-table-row-loading');
    expect(skeletonRows.length).toBe(5);
  });

  it('hiển thị thông báo khi dữ liệu rỗng', () => {
    render(
      <DataTable
        columns={TEST_COLUMNS}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyText="Không có dữ liệu bài viết."
      />
    );

    expect(screen.getByText('Không có dữ liệu bài viết.')).toBeInTheDocument();
  });
});
