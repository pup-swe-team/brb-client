
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
      affiliation?: string;
      lenderYear?: string;
      lenderRating?: string;
      [key: string]: any;
    };
  };

  Login: undefined;
  Register: undefined;
  VerifyIdentity: undefined;

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
  PasswordResetSent: undefined;

  Terms: undefined;
  Privacy: undefined;

  AccountSuspended: undefined;

  Tabs: undefined;

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
