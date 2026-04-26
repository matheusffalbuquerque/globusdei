'use client';

import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

/**
 * formatUnreadNotificationCount keeps menu counters compact and capped at 99+.
 */
export function formatUnreadNotificationCount(count: number): string | null {
  const normalizedCount = Math.floor(count);

  if (!Number.isFinite(count) || normalizedCount <= 0) {
    return null;
  }

  return normalizedCount > 99 ? '99+' : String(normalizedCount);
}

/**
 * NotificationUnreadBadge renders the shared unread counter used by portal menus.
 */
export function NotificationUnreadBadge({
  count,
  active = false,
}: {
  count: number;
  active?: boolean;
}) {
  const label = formatUnreadNotificationCount(count);

  if (!label) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      aria-label={`${label} notificações não lidas`}
      className={cn(
        'h-5 min-w-5 justify-center rounded-full border-transparent bg-red-600 px-1.5 py-0 text-[10px] font-bold leading-none text-white shadow-sm',
        active && 'bg-white text-primary shadow-none',
      )}
    >
      {label}
    </Badge>
  );
}
