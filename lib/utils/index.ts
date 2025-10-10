/**
 * 숫자에 콤마 형식 적용
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('ko-KR').format(value);
}

/**
 * 상대적 시간 표시 (예: "3시간 전")
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 밀리초 단위 변환
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return `${Math.max(1, seconds)}초 전`;
  }
}

/**
 * 포인트 합계 계산
 */
export function sumPoints(items: Record<string, unknown>[], key: string = 'amount'): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
}

/**
 * yyyy-MM-dd 형식으로 날짜 포맷팅
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 퍼센트 변화량 계산
 */
export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
