import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, text } from '../../../theme';
import { Button, Input } from '../../../shared/components';
import { extractApiError } from '../../../services/http';
import { SettingsShell } from '../components/SettingsShell';
import { getAccountProfile, updateProfile } from '../services/accountService';

const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;
const BIO_MAX = 200;
type Errors = { name?: string; contact?: string; photo?: string; submit?: string };

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<any>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    getAccountProfile()
      .then((p) => {
        setName(p.fullName);
        setContact(p.contactNumber);
        setAddress(p.homeAddress);
        setBio(p.bio);
        setPhoto(p.photoUri);
      })
      .catch((e) => setErrors({ submit: extractApiError(e) }))
      .finally(() => setLoading(false));
  }, []);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission required', 'Allow photo library access to change your photo.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const fileName = a.fileName || a.uri.split('/').pop() || 'photo';
    const okType = ['image/jpeg', 'image/png', 'image/webp'].includes((a.mimeType || '').toLowerCase()) || /\.(jpe?g|png|webp)$/i.test(fileName);
    if (!okType) return setErrors((e) => ({ ...e, photo: 'Use a JPEG, PNG or WEBP image.' }));
    if (a.fileSize != null && a.fileSize > 5 * 1024 * 1024) return setErrors((e) => ({ ...e, photo: 'The photo must be 5 MB or less.' }));
    setPhoto(a.uri);
    setPhotoAsset({ uri: a.uri, name: a.fileName || a.uri.split('/').pop(), type: a.mimeType, fileSize: a.fileSize, file: (a as any).file });
    setPhotoChanged(true);
    setSaved(false);
    setErrors((e) => ({ ...e, photo: undefined }));
  };

  const save = async () => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Please enter your full name.';
    if (!PH_MOBILE.test(contact.trim())) next.contact = 'Use a PH mobile number, e.g. 09171234567.';
    setErrors(next);
    if (next.name || next.contact) return;
    setSaving(true);
    setSaved(false);
    try {
      const photoFile = Platform.OS === 'web' ? photoAsset?.file ?? null : photoAsset ? { uri: photoAsset.uri, name: photoAsset.name, type: photoAsset.type } : null;
      await updateProfile({ fullName: name.trim(), contactNumber: contact.trim(), homeAddress: address.trim(), bio: bio.trim(), photoUri: photo, photoChanged, photoFile });
      setPhotoChanged(false);
      setSaved(true);
    } catch (e) {
      setErrors({ submit: extractApiError(e) });
    } finally {
      setSaving(false);
    }
  };

  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'BRB';
  const edit = (set: (v: string) => void) => (v: string) => {
    set(v);
    setSaved(false);
  };

  return (
    <SettingsShell title="Edit Profile" onBack={() => navigation.goBack()}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <>
          <View style={s.photoWrap}>
            {photo ? <Image source={{ uri: photo }} style={s.avatar} /> : <View style={s.avatar}><Text style={s.initials}>{initials}</Text></View>}
            <Pressable onPress={pickPhoto} accessibilityRole="button"><Text style={s.link}>Change photo</Text></Pressable>
            {errors.photo ? <Text style={s.error}>{errors.photo}</Text> : null}
          </View>

          <Input label="Full name" required value={name} onChangeText={edit(setName)} error={errors.name} placeholder="Full name" />
          <Input label="Contact number" required value={contact} onChangeText={edit(setContact)} error={errors.contact} keyboardType="phone-pad" placeholder="09171234567" />
          <Input label="Home address" value={address} onChangeText={edit(setAddress)} placeholder="Street, barangay, city" />

          <View style={{ gap: 4 }}>
            <Text style={text.body}>Bio</Text>
            <TextInput
              style={s.bio}
              value={bio}
              onChangeText={edit((v) => setBio(v.slice(0, BIO_MAX)))}
              placeholder="Tell other users a bit about yourself."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={BIO_MAX}
            />
            <Text style={[text.caption, { textAlign: 'right' }]}>{bio.length} / {BIO_MAX}</Text>
          </View>

          {errors.submit ? <Text style={s.error}>{errors.submit}</Text> : null}
          {saved ? <Text style={s.success}>Profile updated.</Text> : null}
          <Button title="Save changes" onPress={save} loading={saving} />
        </>
      )}
    </SettingsShell>
  );
}

const s = StyleSheet.create({
  photoWrap: { alignItems: 'center', gap: spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontSize: 28, fontWeight: '700' },
  link: { color: colors.link, fontWeight: '600', fontSize: 13 },
  bio: { minHeight: 90, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, backgroundColor: colors.white, padding: 12, fontSize: 14, color: colors.text },
  error: { color: colors.error, fontSize: 12 },
  success: { color: colors.success, fontSize: 13, fontWeight: '600' },
});
