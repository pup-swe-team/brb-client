export type AdminCaseStatus = 'Overdue' | 'Unreturned';
export type CaseResolution = 'Open' | 'Reminder sent' | 'Escalated' | 'Resolved';
export type AdminCaseAction = 'sendReminder' | 'escalate' | 'markReturned';

export type CaseEvent = { id: string; label: string; date: string }; // date: YYYY-MM-DD

export type AdminCase = {
  id: string;
  orderId: string;
  itemTitle: string;
  borrowerName: string;
  lenderName: string;
  status: AdminCaseStatus;
  resolution: CaseResolution;
  dueDate: string; // YYYY-MM-DD
  daysLate: number;
  depositPhp: number; // PHP
  events: CaseEvent[];
};