import type { NavigatorScreenParams } from '@react-navigation/native';


export type RootStackParamList = {
  Landing: undefined;
  ListingDetail: undefined;
  ItemDetail: {
    item: {
      title?: string;
      author?: string;
      price?: string;
      image?: string;
      category?: string;
      details?: string[];
      lenderName?: string;
      lenderId?: string;
      lenderVerified?: boolean;
      availableFrom?: string;
      availableTo?: string;
      description?: string;
      photos?: string[];
      affiliation?: string;
      lenderYear?: string;
      lenderRating?: string;
      [key: string]: any;
    };
  };

  Login: undefined;
  Register: undefined;
  VerifyIdentity: undefined;
  LenderProfile: { lenderId: string } | undefined;
  MyListings: undefined;
  EditListing: { listing: import('../features/listings/services/listingsService').ManagedListing };
  AccountSettings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  ChangeEmail: undefined;
  NotificationPreferences: undefined;
  DeactivateAccount: undefined;

  // Sprint 3
  OrderDetail: { orderId: string; role?: 'Borrower' | 'Lender' };
  HandoverCode: { orderId: string; mode: 'show' | 'enter' };
  ReturnCode: { orderId: string; mode: 'show' | 'enter' };
  ReportDamage: { orderId: string };
  AdminCase: { caseId: string };

  SignUpMessage: undefined;

  VerifyEmail:
    | {
        email?: string;
        uid?: string;
        token?: string;
      }
    | undefined;

  EmailVerified: undefined;

  ForgotPassword: undefined;
  NewPassword: { uid?: string; token?: string } | undefined;
  PasswordResetSent: undefined;

  Terms: undefined;
  Privacy: undefined;

  AccountSuspended: undefined;

  Tabs: NavigatorScreenParams<TabParamList> | undefined;

  Gallery: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  AddItem: undefined;
  Chat: undefined;
  Profile: undefined;
};

export interface PublicUser {
  id: string;
  fullName: string;
  verified: boolean;
}
