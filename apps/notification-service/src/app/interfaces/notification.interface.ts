/**
 * Generic payload for dispatching notifications to Agentes or Colaboradores.
 */
export interface NotificationPayload {
  to: string;
  subject?: string;
  message: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Standardized provider interface representing any outgoing communication channel.
 * Enforces SOLID's Dependency Inversion Principle.
 */
export interface INotificationProvider {
  /**
   * Dispatches the message via the implemented protocol.
   * @param payload The structured message data.
   * @returns boolean determining true network success.
   */
  send(payload: NotificationPayload): Promise<boolean>;
}
