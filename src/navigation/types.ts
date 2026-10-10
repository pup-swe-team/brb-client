export type RootStackParamList = {
  Landing: undefined;
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