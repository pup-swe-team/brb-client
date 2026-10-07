import { http } from '../../../services/http'; // TODO: adjust to how http.ts actually exports the axios instance

export type IdDocumentType = 'PUP ID' | 'Government ID';

export type SubmitIdPayload = { documentType: IdDocumentType; uri: string; consent: boolean };

// TODO: confirm endpoint + field names with the backend team.
export async function submitIdDocument({ documentType, uri, consent }: SubmitIdPayload) {
  const form = new FormData();
  form.append('documentType', documentType);
  form.append('consent', String(consent));
  form.append('document', { uri, name: 'id-document.jpg', type: 'image/jpeg' } as any);

  const res = await http.post('/verification/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}