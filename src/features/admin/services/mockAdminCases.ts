import { AdminCase } from './adminCaseTypes';

// Mock data for EXPO_PUBLIC_USE_MOCK=true. c1 = Overdue, c2 = Unreturned.
export const MOCK_ADMIN_CASES: Record<string, AdminCase> = {
  c1: {
    id: 'c1',
    orderId: 'o4',
    itemTitle: 'Concepts of Programming Languages',
    borrowerName: 'Princess Izzy Dancal',
    lenderName: 'John Ezekiel Lacap',
    status: 'Overdue',
    resolution: 'Open',
    dueDate: '2026-10-24',
    daysLate: 3,
    depositPhp: 300,
    events: [
      { id: 'e1', label: 'Request accepted by lender', date: '2026-10-15' },
      { id: 'e2', label: 'Handover confirmed with code', date: '2026-10-17' },
      { id: 'e3', label: 'Return due date passed', date: '2026-10-24' },
      { id: 'e4', label: 'Marked Overdue automatically', date: '2026-10-25' },
    ],
  },
  c2: {
    id: 'c2',
    orderId: 'o10',
    itemTitle: 'Engineering Drawing Set',
    borrowerName: 'Aaron Bien De Guzman',
    lenderName: 'Felicity Faith Villeta',
    status: 'Unreturned',
    resolution: 'Reminder sent',
    dueDate: '2026-10-08',
    daysLate: 14,
    depositPhp: 1250,
    events: [
      { id: 'e5', label: 'Handover confirmed with code', date: '2026-10-05' },
      { id: 'e6', label: 'Return due date passed', date: '2026-10-08' },
      { id: 'e7', label: 'Marked Overdue automatically', date: '2026-10-09' },
      { id: 'e8', label: 'Reminder sent to borrower', date: '2026-10-15' },
      { id: 'e9', label: 'Marked Unreturned', date: '2026-10-22' },
    ],
  },
};