import { http, USE_MOCK } from '../../../services/http';

export type IdDocumentType = 'PUP ID' | 'Government ID';

// Backend lookup names from `GET /identity/documents/list/` (IdentityDocumentStatus).
export type IdentityDocumentStatus = 'pending' | 'approved' | 'rejected';

export type SubmitIdPayload = {
  documentType: IdDocumentType;
  uri: string;
  consent: boolean;
  idNumber: string;
  nameOnDocument: string;
  // Web-only: expo-image-picker supplies the real File here. Native uses the
  // `{ uri, name, type }` object React Native's FormData understands.
  file?: File;
  fileName?: string;
  mimeType?: string;
};

const DOC_TYPE_LOOKUP: Record<IdDocumentType, string> = {
  'PUP ID': 'pup_id',
  'Government ID': 'government_id',
};

// Mock mode only. Set EXPO_PUBLIC_MOCK_VERIFIED=true to start as an approved user;
// submitting an ID in mock mode moves the status to 'pending'.
let mockStatus: IdentityDocumentStatus | undefined =
  process.env.EXPO_PUBLIC_MOCK_VERIFIED === 'true' ? 'approved' : undefined;

export async function submitIdDocument(payload: SubmitIdPayload) {
  if (USE_MOCK) {
    mockStatus = 'pending';
    return { detail: 'Submission recorded (mock).' };
  }

  const form = new FormData();
  form.append('document_type', DOC_TYPE_LOOKUP[payload.documentType]);
  form.append('consent_given', String(payload.consent));
  form.append('id_number', payload.idNumber);
  form.append('name_on_document', payload.nameOnDocument);

  if (payload.file) {
    form.append('document_file', payload.file);
  } else {
    form.append('document_file', {
      uri: payload.uri,
      name: payload.fileName ?? 'id-document.jpg',
      type: payload.mimeType ?? 'image/jpeg',
    } as any);
  }

  // No manual `Content-Type`: axios lets the browser/RN serialiser attach the
  // multipart boundary on each platform (web File vs native RN FormData).
  const res = await http.post('/identity/documents/', form);
  return res.data;
}

/**
 * Read the caller's own review status so the profile can reflect the admin's
 * decision (submit → admin reviews in /portal/ or Django Admin → status here).
 * Returns undefined when in mock mode or when the user has no submission yet.
 */
export async function getLatestIdentityDocumentStatus(): Promise<
  IdentityDocumentStatus | undefined
> {
  if (USE_MOCK) return mockStatus;

  const { data } = await http.get<{
    count: number;
    results: { status: IdentityDocumentStatus }[];
  }>('/identity/documents/list/');

  // The backend orders by `-submitted_at`, so the newest submission is first.
  return data.results[0]?.status;
}