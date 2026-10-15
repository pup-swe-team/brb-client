import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Button, Input, ScreenContainer, TopBar } from '../../../shared/components';
import { colors, spacing, text } from '../../../theme';
import { extractApiError } from '../../auth/services/authService';
import { InlineBanner } from '../components/InlineBanner';
import type { BannerVariant } from '../components/InlineBanner';
import { getProfileDetails, updateProfile } from '../services/accountService';
import type { PhotoUpload } from '../services/accountService';

const BIO_MAX = 150;
const PHOTO_SIZE = 96;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // same 5 MB cap as the ID upload
const PH_MOBILE = /^09\d{9}$/;

type Errors = { fullName?: string; contactNumber?: string; homeAddress?: string };

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<PhotoUpload | undefined>(undefined);

  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<{ variant: BannerVariant; message: string } | null>(null);

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    getProfileDetails()
      .then((profile) => {
        if (!active) return;
        setFullName(profile.fullName);
        setContactNumber(profile.contactNumber);
        setHomeAddress(profile.homeAddress);
        setBio(profile.bio);
        setPhotoUri(profile.photoUri);
      })
      .catch((err) => {
        if (active) setBanner({ variant: 'error', message: extractApiError(err) });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || 'BRB';

  async function handleChangePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setBanner({
        variant: 'error',
        message: permission.canAskAgain
          ? 'Photo library access is needed to choose a photo.'
          : 'Photo library access is needed to choose a photo. Turn it on in your device Settings.',
      });
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
        setBanner({ variant: 'error', message: 'That photo is too large. Choose one under 5 MB.' });
        return;
      }
      setNewPhoto({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
        file: asset.file,
      });
      setPhotoUri(asset.uri);
      setBanner(null);
    } catch {
      setBanner({ variant: 'error', message: 'Could not open your photos. Please try again.' });
    }
  }

  async function handleSave() {
    if (saving) return;
    setBanner(null);

    const trimmedName = fullName.trim();
    const trimmedAddress = homeAddress.trim();
    // "0917 123 4567" and "0917-123-4567" are both fine; we send plain digits.
    const digits = contactNumber.replace(/[\s-]/g, '');

    const next: Errors = {};
    if (!trimmedName) next.fullName = 'Please enter your full name.';
    if (!digits) {
      next.contactNumber = 'Please enter your contact number.';
    } else if (!PH_MOBILE.test(digits)) {
      next.contactNumber = 'Enter a valid PH mobile number, e.g. 0917 123 4567.';
    }
    if (!trimmedAddress) next.homeAddress = 'Please enter your home address.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await updateProfile({
        fullName: trimmedName,
        contactNumber: digits,
        homeAddress: trimmedAddress,
        bio: bio.trim(),
        photo: newPhoto,
      });
      setBanner({ variant: 'success', message: 'Profile updated.' });
      leaveTimer.current = setTimeout(() => navigation.goBack(), 900);
    } catch (err) {
      setBanner({ variant: 'error', message: extractApiError(err) });
      setSaving(false);
    }
  }

  return (
    <View style={s.root}>
      <TopBar title="Edit Profile" onBack={() => navigation.goBack()} />
      <ScreenContainer scroll keyboardAware>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={s.loader} />
        ) : (
          <>
            {banner ? <InlineBanner variant={banner.variant} message={banner.message} /> : null}

            <View style={s.photoBlock}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={s.photo}
                  accessibilityLabel="Your profile photo"
                />
              ) : (
                <View style={[s.photo, s.initials]}>
                  <Text style={s.initialsText}>{initials}</Text>
                </View>
              )}
              <Pressable onPress={handleChangePhoto} accessibilityRole="button">
                <Text style={s.changePhoto}>Change photo</Text>
              </Pressable>
            </View>

            <Input
              label="Full Name"
              required
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              autoCapitalize="words"
              error={errors.fullName}
            />

            <Input
              label="Contact Number"
              required
              value={contactNumber}
              onChangeText={(value) => {
                setContactNumber(value);
                setErrors((e) => ({ ...e, contactNumber: undefined }));
              }}
              keyboardType="phone-pad"
              placeholder="0917 123 4567"
              error={errors.contactNumber}
            />

            <Input
              label="Home Address"
              required
              value={homeAddress}
              onChangeText={(value) => {
                setHomeAddress(value);
                setErrors((e) => ({ ...e, homeAddress: undefined }));
              }}
              autoCapitalize="words"
              error={errors.homeAddress}
            />

            <View style={s.bioBlock}>
              <Input
                label="Bio (Optional)"
                value={bio}
                onChangeText={setBio}
                maxLength={BIO_MAX}
                multiline
                numberOfLines={4}
                placeholder="Tell other students a little about yourself"
                style={s.bioInput}
              />
              <Text style={[text.caption, s.counter]}>
                {bio.length} / {BIO_MAX}
              </Text>
            </View>

            <Button title="Save Changes" onPress={handleSave} loading={saving} />
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: spacing.xxxl },
  photoBlock: { alignItems: 'center', gap: spacing.sm },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2 },
  initials: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { ...text.h1, color: colors.white },
  changePhoto: { ...text.body, color: colors.link, fontWeight: '600' },
  bioBlock: { gap: spacing.xs },
  bioInput: {
    ...text.body,
    flex: 1,
    minHeight: 96,
    textAlignVertical: 'top',
    paddingVertical: spacing.sm,
  },
  counter: { textAlign: 'right' },
});
