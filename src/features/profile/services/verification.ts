import { http, USE_MOCK } from '../../../services/http';

export type IdDocumentType = 'PUP ID' | 'Government ID';

export type SubmitIdPayload = {
  documentType: IdDocumentType;
  uri: string;
  consent: boolean;
  idNumber?: string;
  nameOnDocument?: string;
};

const DOC_TYPE_LOOKUP: Record<IdDocumentType, string> = {
  'PUP ID': 'pup_id',
  'Government ID': 'government_id',
};

// NOTE: the backend (IdentityDocumentSubmissionSerializer) also requires
// `id_number` and `name_on_document`. VerifyIdentityScreen does not collect
// them yet, so a real submission stays blocked until the screen adds inputs
// (design change -- see docs/BACKEND_CONNECTION.md).
export async function submitIdDocument(payload: SubmitIdPayload) {
  if (USE_MOCK) return { detail: 'Submission recorded (mock).' };

  const form = new FormData();
  form.append('document_type', DOC_TYPE_LOOKUP[payload.documentType]);
  form.append('consent_given', String(payload.consent));
  form.append('id_number', payload.idNumber ?? '');
  form.append('name_on_document', payload.nameOnDocument ?? '');
  form.append('document_file', {
    uri: payload.uri,
    name: 'id-document.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await http.post('/identity/documents/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}