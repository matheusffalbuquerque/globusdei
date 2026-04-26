export const NOTIFICATION_UNREAD_COUNT_CHANGED_EVENT =
  'globusdei:notifications-unread-count-changed';

/**
 * dispatchNotificationUnreadCountChanged notifies layout components to refresh unread badges.
 */
export function dispatchNotificationUnreadCountChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(NOTIFICATION_UNREAD_COUNT_CHANGED_EVENT));
}
