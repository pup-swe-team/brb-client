import { PublicLenderProfile } from './lenderTypes';

// Mock data for EXPO_PUBLIC_USE_MOCK=true.
// u1 = full profile, u2 = verified, u3 = NOT verified (no badge), u4 = no reviews / no listings (empty states)
export const MOCK_LENDERS: Record<string, PublicLenderProfile> = {
  u1: {
    id: 'u1',
    fullName: 'Danielo Kim R. Ang',
    verified: true,
    affiliation: 'Student',
    program: 'BS Computer Engineering 3rd Year',
    rating: 4.8,
    reviewCount: 5,
    memberSince: '2025-08-15',
    listings: [
      { id: 'l1', title: 'Basic Calculator', category: 'School Supplies', location: 'PUP Main Gate', availableFrom: '2026-10-01', availableTo: '2026-12-31' },
      { id: 'l7', title: 'Arduino Uno Starter Kit', category: 'Electronics', location: 'PUP Lagoon', availableFrom: '2026-11-01', availableTo: '2026-12-20' },
      { id: 'l13', title: 'Discrete Math Reviewer', category: 'Textbooks', location: 'PUP Library', availableFrom: '2026-10-10', availableTo: '2026-12-10' },
    ],
    reviews: [
      { id: 'r1', reviewerName: 'Princess Izzy Dancal', reviewerVerified: true, rating: 5, itemTitle: 'Basic Calculator', date: '2026-10-07', comment: 'Smooth handoff and the calculator was in perfect condition. Would borrow again.' },
      { id: 'r2', reviewerName: 'Aaron Bien De Guzman', reviewerVerified: true, rating: 5, itemTitle: 'Discrete Math Reviewer', date: '2026-09-28', comment: 'Replied right away and was on time at the meetup.' },
      { id: 'r3', reviewerName: 'Felicity Faith Villeta', reviewerVerified: true, rating: 5, itemTitle: 'Arduino Uno Starter Kit', date: '2026-09-15', comment: 'Complete kit, nothing missing. Very helpful.' },
      { id: 'r4', reviewerName: 'Neo Ervine Y. Geroda', reviewerVerified: true, rating: 5, itemTitle: 'Basic Calculator', date: '2026-08-30', comment: 'Easy to deal with.' },
      { id: 'r5', reviewerName: 'John Ezekiel Lacap', reviewerVerified: false, rating: 4, itemTitle: 'Discrete Math Reviewer', date: '2026-08-12', comment: 'Good reviewer, a few pages were already marked up.' },
    ],
  },
  u2: {
    id: 'u2',
    fullName: 'Neo Ervine Y. Geroda',
    verified: true,
    affiliation: 'Student',
    program: 'BS Chemical Engineering 2nd Year',
    rating: 4.5,
    reviewCount: 4,
    memberSince: '2025-09-02',
    listings: [
      { id: 'l2', title: 'Lab Coat (Medium)', category: 'Lab Equipment', location: 'PUP CEA Building', availableFrom: '2026-10-10', availableTo: '2026-11-30' },
      { id: 'l8', title: 'Lab Apron (Large)', category: 'Lab Equipment', location: 'PUP Main Gate', availableFrom: '2026-10-12', availableTo: '2026-11-15' },
      { id: 'l14', title: 'Extension Cord (5m)', category: 'Electronics', location: 'PUP Lagoon', availableFrom: '2026-10-01', availableTo: '2026-12-31' },
    ],
    reviews: [
      { id: 'r6', reviewerName: 'Danielo Kim R. Ang', reviewerVerified: true, rating: 5, itemTitle: 'Lab Coat (Medium)', date: '2026-10-03', comment: 'Clean and fits well.' },
      { id: 'r7', reviewerName: 'Princess Izzy Dancal', reviewerVerified: true, rating: 4, itemTitle: 'Lab Apron (Large)', date: '2026-09-20', comment: 'Good condition, returned it on time.' },
      { id: 'r8', reviewerName: 'Aaron Bien De Guzman', reviewerVerified: true, rating: 5, itemTitle: 'Lab Coat (Medium)', date: '2026-09-01', comment: 'Reliable lender.' },
      { id: 'r9', reviewerName: 'Felicity Faith Villeta', reviewerVerified: true, rating: 4, itemTitle: 'Extension Cord (5m)', date: '2026-08-18', comment: 'Worked fine, a bit short for my needs.' },
    ],
  },
  u3: {
    id: 'u3',
    fullName: 'John Ezekiel Lacap',
    verified: false,
    affiliation: 'Faculty',
    program: 'College of Computer Science',
    rating: 3.8,
    reviewCount: 4,
    memberSince: '2026-01-20',
    listings: [
      { id: 'l4', title: 'Concepts of Programming Languages', category: 'Textbooks', location: 'PUP Library', availableFrom: '2026-10-01', availableTo: '2026-10-31' },
      { id: 'l11', title: 'Barong Tagalog (Large)', category: 'Others', location: 'PUP Main Gate', availableFrom: '2026-10-22', availableTo: '2026-11-05' },
    ],
    reviews: [
      { id: 'r10', reviewerName: 'Neo Ervine Y. Geroda', reviewerVerified: true, rating: 4, itemTitle: 'Concepts of Programming Languages', date: '2026-09-25', comment: 'Book was fine.' },
      { id: 'r11', reviewerName: 'Princess Izzy Dancal', reviewerVerified: true, rating: 4, itemTitle: 'Barong Tagalog (Large)', date: '2026-09-02', comment: 'Okay overall.' },
      { id: 'r12', reviewerName: 'Aaron Bien De Guzman', reviewerVerified: true, rating: 4, itemTitle: 'Concepts of Programming Languages', date: '2026-08-14', comment: 'Responded a bit slowly but the handoff went well.' },
      { id: 'r13', reviewerName: 'Danielo Kim R. Ang', reviewerVerified: true, rating: 3, itemTitle: 'Barong Tagalog (Large)', date: '2026-07-30', comment: 'Item had a small stain.' },
    ],
  },
  u4: {
    id: 'u4',
    fullName: 'Felicity Faith Villeta',
    verified: true,
    affiliation: 'Staff',
    program: 'Office of Student Affairs',
    rating: 0,
    reviewCount: 0,
    memberSince: '2026-10-01',
    listings: [],
    reviews: [],
  },
};