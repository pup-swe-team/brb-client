import type { Order, OrderRole } from '../../../shared/types';

// Props every action slot on OrderDetailScreen receives.
export interface OrderActionProps {
  order: Order;
  role: OrderRole;
  navigation: any;
  // Call after an action changes the order (accept, cancel, code confirmed...)
  // so the detail screen reloads and shows the new status.
  onChanged: () => void;
}
