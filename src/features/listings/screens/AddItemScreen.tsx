import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../../theme';
import { useVerificationStatus } from '../../profile/hooks/useVerificationStatus';
import { CATEGORIES, CONDITIONS, PICKUP_LOCATIONS, isValidDate, todayISO } from '../constants';
import { ManagedListing, createListing, updateListing } from '../services/listingsService';

const RED = '#B2080C';
const TEXT = '#35415F';
const MUTED = '#8B97AD';
const BORDER = '#D9E0EA';
const BG = '#F4F7FA';
const WHITE = '#FFFFFF';
const ERROR = '#F16C7A';

type Photo = { uri: string; name: string; size?: number | null; mimeType?: string | null };
type Errors = { photos?: string[]; title?: string; category?: string; pickup?: string; ownership?: string; price?: string; from?: string; until?: string };

export default function AddItemScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  // Edit mode: opened from My Listings with the listing to change.
  const editing: ManagedListing | undefined = route?.params?.listing;
  const { status, loading: statusLoading, isVerified } = useVerificationStatus();
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(
    (editing?.photos ?? []).map((uri) => ({ uri, name: uri.split('/').pop() || 'item-photo' })),
  );
  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [courseCode, setCourseCode] = useState(editing?.courseCode ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [condition, setCondition] = useState(editing?.condition ?? 'Good');
  const [lendingType, setLendingType] = useState<'Free Lending' | 'For Rent'>(editing?.lendingType ?? 'For Rent');
  const [price, setPrice] = useState(editing ? editing.price : '₱10');
  const [duration, setDuration] = useState(editing?.duration ?? '5 days');
  const [availability, setAvailability] = useState<'Available now' | 'Available from'>(editing?.availability ?? 'Available from');
  const [fromDate, setFromDate] = useState(editing?.fromDate ?? '');
  const [untilDate, setUntilDate] = useState(editing?.untilDate ?? '');
  const [pickup, setPickup] = useState(editing?.pickup ?? '');
  // Ownership must be confirmed again on every save, including edits.
  const [ownership, setOwnership] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [dropdown, setDropdown] = useState<'pickup' | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const choosePhoto = async () => {
    if (photos.length >= 5) return Alert.alert('Photo limit reached', 'You can add up to 5 photos.');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission required', 'Allow photo library access to add photos.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const name = asset.fileName || asset.uri.split('/').pop() || 'item-photo';
    const type = (asset.mimeType || '').toLowerCase();
    const size = asset.fileSize ?? null;
    let photoError = '';
    if (!(['image/jpeg', 'image/png', 'image/webp'].includes(type) || /\.(jpe?g|png|webp)$/i.test(name))) photoError = `${name} isn't supported. Use JPEG, PNG or WEBP.`;
    else if (size != null && size > 5 * 1024 * 1024) photoError = `${name} is ${(size / 1048576).toFixed(1)} MB. The limit is 5 MB.`;
    if (photoError) {
      setErrors(v => ({ ...v, photos: [...(v.photos || []).filter(e => !e.includes(name)), photoError] }));
      setShowErrors(true);
      return;
    }
    setPhotos(v => [...v, { uri: asset.uri, name, size, mimeType: asset.mimeType }]);
    setErrors(v => ({ ...v, photos: (v.photos || []).filter(e => !e.includes(name)) }));
  };

  const validate = () => {
    const next: Errors = {};
    if (!photos.length) next.photos = ['Add at least 1 photo.'];
    if (!title.trim()) next.title = 'Resource title is required.';
    if (!category) next.category = 'Choose a category.';
    if (lendingType === 'For Rent' && (!price.trim() || Number(price.replace(/[^0-9.]/g, '')) <= 0)) next.price = 'Enter a valid price per day.';
    if (availability === 'Available from') {
      const from = fromDate.trim();
      const until = untilDate.trim();
      if (!from) next.from = 'Enter a start date (YYYY-MM-DD).';
      else if (!isValidDate(from)) next.from = 'Use YYYY-MM-DD, e.g. 2026-11-05.';
      else if (!editing && from < todayISO()) next.from = 'The start date cannot be in the past.';
      if (!until) next.until = 'Enter an end date (YYYY-MM-DD).';
      else if (!isValidDate(until)) next.until = 'Use YYYY-MM-DD, e.g. 2026-11-30.';
      else if (!next.from && until < from) next.until = 'The end date must be on or after the start date.';
    }
    if (!pickup) next.pickup = 'Choose a pickup location.';
    else if (!PICKUP_LOCATIONS.some((l) => l.name === pickup)) next.pickup = 'Choose one of the locations set by BRB Admins.';
    if (!ownership) next.ownership = 'Confirm ownership to post this item.';
    setErrors(v => ({ ...v, ...next }));
    setShowErrors(true);
    return Object.keys(next).length === 0;
  };
  const resetForm = () => {
    setPhotos([]); setTitle(''); setCategory(''); setCourseCode(''); setDescription(''); setCondition('Good');
    setLendingType('For Rent'); setPrice('₱10'); setDuration('5 days'); setAvailability('Available from');
    setFromDate(''); setUntilDate(''); setPickup(''); setOwnership(false); setErrors({}); setShowErrors(false);
  };
  const postItem = async () => {
    if (saving) return;
    if (!validate()) return Alert.alert('Validation errors', 'Fix the highlighted fields before posting your item.');
    const input = {
      title: title.trim(), category, courseCode: courseCode.trim(), description: description.trim(), condition, lendingType,
      price: lendingType === 'Free Lending' ? '' : price.trim(), duration, availability,
      fromDate: availability === 'Available now' ? todayISO() : fromDate.trim(),
      untilDate: availability === 'Available now' ? '' : untilDate.trim(), pickup, photos: photos.map((p) => p.uri),
    };
    setSaving(true);
    try {
      if (editing) await updateListing(editing.id, input);
      else await createListing(input);
      if (!editing) resetForm();
      Alert.alert(editing ? 'Listing updated' : 'Listing posted', editing ? 'Your changes were saved.' : 'Your item is now live.');
      if (editing) navigation.goBack();
      else navigation.navigate('MyListings');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const saveDraft = () => { setDraftSaved(true); Alert.alert('Draft saved', 'Your draft is saved for this session.'); };
  const errorText = (text?: string) => showErrors && text ? <View style={s.errorRow}><Ionicons name="alert-circle-outline" size={13} color={ERROR} /><Text style={s.errorText}>{text}</Text></View> : null;
  const chip = (label: string, selected: boolean, onPress: () => void, wide = false) => <Pressable key={label} onPress={onPress} style={[s.chip, wide && s.wideChip, selected && s.chipSelected]}><Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text></Pressable>;

  const header = (
    <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
      {editing ? (
        <Pressable style={s.headerSpacer} onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </Pressable>
      ) : <View style={s.headerSpacer} />}
      <Text style={s.headerTitle}>{editing ? 'Edit Listing' : 'Add Item'}</Text>
      <View style={s.headerActionSpacer} />
    </View>
  );

  // Only verified users can create or edit listings.
  if (statusLoading) {
    return <View style={s.screen}>{header}<View style={s.gate}><ActivityIndicator color={colors.primary} /></View></View>;
  }
  if (!isVerified) {
    const copy = status === 'Pending'
      ? { title: 'Verification in review', body: 'Your ID is still being reviewed. You can create listings once you are verified.', action: '' }
      : status === 'Rejected'
        ? { title: 'Verification not approved', body: 'Your ID was not approved. Upload a new ID to start listing items.', action: 'Upload a new ID' }
        : { title: 'Verify your identity first', body: 'Only verified users can list items. Upload your PUP ID or a government-issued ID to get started.', action: 'Verify Now' };
    return (
      <View style={s.screen}>
        {header}
        <View style={s.gate}>
          <Ionicons name="shield-checkmark-outline" size={52} color={RED} />
          <Text style={s.gateTitle}>{copy.title}</Text>
          <Text style={s.gateBody}>{copy.body}</Text>
          {copy.action ? (
            <Pressable style={[s.postButton, s.gateButton]} onPress={() => navigation.navigate('VerifyIdentity')}>
              <Text style={s.postText}>{copy.action}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return <View style={s.screen}>
    <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
    {header}
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {showErrors && Object.values(errors).some(v => Array.isArray(v) ? v.length > 0 : !!v) && <View style={s.banner}><Ionicons name="warning-outline" size={18} color={ERROR}/><Text style={s.bannerText}><Text style={s.bannerStrong}>Fix the highlighted fields</Text> before posting your item.</Text></View>}

      <Text style={s.label}>Photos (up to 5) <Text style={s.required}>*</Text></Text>
      <View style={s.photoRow}>
        {photos.map((photo, i) => <View key={`${photo.uri}-${i}`} style={s.photoTile}><Image source={{ uri: photo.uri }} style={s.photoImage}/><Pressable style={s.removePhoto} onPress={() => setPhotos(v => v.filter((_, n) => n !== i))}><Ionicons name="close-circle" size={19} color={RED}/></Pressable><Text numberOfLines={1} style={s.photoName}>{photo.name}</Text></View>)}
        {photos.length < 5 && <Pressable onPress={choosePhoto} style={[s.photoTile, s.addTile]}><Ionicons name="camera-outline" size={22} color={MUTED}/><Text style={s.photoCaption}>Add</Text></Pressable>}
      </View>
      <Text style={s.helper}>At least 1 photo · JPEG, PNG or WEBP · max 5 MB each</Text>
      {showErrors && errors.photos?.map((e, i) => <View key={`${e}-${i}`} style={s.errorRow}><Ionicons name="information-circle-outline" size={13} color={ERROR}/><Text style={s.errorText}>{e}</Text></View>)}

      <Text style={s.label}>Resource Title <Text style={s.required}>*</Text></Text>
      <TextInput value={title} onChangeText={v => {setTitle(v); setErrors(e => ({...e, title: undefined}));}} placeholder="Enter a title" placeholderTextColor="#A5AFC1" style={[s.input, showErrors && errors.title && s.inputError]}/>{errorText(errors.title)}

      <Text style={s.label}>Category <Text style={s.required}>*</Text></Text>
      <View style={s.categoryDropdownWrap}>
        <Pressable
          onPress={() => setCategoryOpen(value => !value)}
          style={[s.select, showErrors && errors.category && s.inputError]}
          accessibilityRole="button"
          accessibilityLabel="Choose category"
        >
          <Text style={[s.selectText, !category && s.placeholder]}>{category || 'Select a category'}</Text>
          <Ionicons name={categoryOpen ? 'chevron-up' : 'chevron-down'} size={17} color={MUTED}/>
        </Pressable>
        {categoryOpen && (
          <View style={s.categoryMenu}>
            {CATEGORIES.map(item => (
              <Pressable
                key={item}
                style={[s.categoryMenuOption, category === item && s.categoryMenuOptionSelected]}
                onPress={() => {
                  setCategory(item);
                  setErrors(e => ({ ...e, category: undefined }));
                  setCategoryOpen(false);
                }}
              >
                <Text style={[s.categoryMenuText, category === item && s.categoryMenuTextSelected]}>{item}</Text>
                {category === item && <Ionicons name="checkmark" size={17} color={RED}/>}
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {errorText(errors.category)}

      <Text style={s.label}>Course Code (Optional)</Text><TextInput value={courseCode} onChangeText={setCourseCode} placeholder="e.g. MATH 101" placeholderTextColor="#A5AFC1" style={s.input} autoCapitalize="characters"/>
      <Text style={s.label}>Description</Text><TextInput value={description} onChangeText={v => setDescription(v.slice(0,300))} placeholder="Describe the item's condition and included accessories." placeholderTextColor="#A5AFC1" style={[s.input,s.description]} multiline textAlignVertical="top" maxLength={300}/><Text style={s.counter}>{description.length} / 300</Text>

      <Text style={s.label}>Condition <Text style={s.required}>*</Text></Text><View style={s.chipRow}>{CONDITIONS.map(v => chip(v, condition === v, () => setCondition(v)))}</View>
      <Text style={s.label}>Lending Type <Text style={s.required}>*</Text></Text><View style={s.segmentRow}>{(['Free Lending','For Rent'] as const).map(v => <Pressable key={v} onPress={() => {setLendingType(v); if (v === 'Free Lending') {setPrice(''); setErrors(e => ({...e, price: undefined}));} else if (!price) setPrice('₱10');}} style={[s.segment, lendingType === v && s.segmentSelected]}><Text style={[s.segmentText,lendingType === v && s.segmentTextSelected]}>{v}</Text></Pressable>)}</View>
      {lendingType === 'For Rent' && <><Text style={s.label}>Price per day <Text style={s.required}>*</Text></Text><TextInput value={price} onChangeText={v => {setPrice(v); setErrors(e => ({...e, price: undefined}));}} placeholder="₱0" placeholderTextColor="#A5AFC1" style={[s.input,showErrors && errors.price && s.inputError]} keyboardType="decimal-pad"/>{errorText(errors.price)}</>}

      <Text style={s.label}>Max Duration <Text style={s.required}>*</Text></Text><View style={s.select}><Text style={s.selectText}>{duration}</Text><Ionicons name="chevron-down" size={17} color={MUTED}/></View><View style={s.chipsWrap}>{['1 day','3 days','5 days','7 days','14 days'].map(v => chip(v,duration === v,() => setDuration(v)))}</View>
      <Text style={s.label}>Availability <Text style={s.required}>*</Text></Text><View style={s.segmentRow}>{(['Available now','Available from'] as const).map(v => <Pressable key={v} onPress={() => setAvailability(v)} style={[s.segment,availability === v && s.segmentSelected]}><Text style={[s.segmentText,availability === v && s.segmentTextSelected]}>{v}</Text></Pressable>)}</View>
      {availability === 'Available from' && <View style={s.dateRow}><View style={s.dateCol}><Text style={s.smallLabel}>From</Text><View style={[s.dateInput,showErrors && errors.from && s.inputError]}><Ionicons name="calendar-outline" size={16} color={MUTED}/><TextInput value={fromDate} onChangeText={v => {setFromDate(v); setErrors(e => ({...e,from:undefined}));}} style={s.dateText} placeholder="YYYY-MM-DD" placeholderTextColor="#A5AFC1" maxLength={10} autoCorrect={false} /></View>{errorText(errors.from)}</View><View style={s.dateCol}><Text style={s.smallLabel}>Until</Text><View style={[s.dateInput,showErrors && errors.until && s.inputError]}><Ionicons name="calendar-outline" size={16} color={MUTED}/><TextInput value={untilDate} onChangeText={v => {setUntilDate(v); setErrors(e => ({...e,until:undefined}));}} style={s.dateText} placeholder="YYYY-MM-DD" placeholderTextColor="#A5AFC1" maxLength={10} autoCorrect={false}/></View>{errorText(errors.until)}</View></View>}

      <Text style={s.label}>Pickup Location <Text style={s.required}>*</Text></Text>
      <Pressable onPress={() => setDropdown('pickup')} style={[s.select,showErrors && errors.pickup && s.inputError]}>
        <Ionicons name="location-outline" size={17} color={MUTED}/>
        <Text style={[s.selectText,!pickup && s.placeholder]}>{pickup || 'Select a pickup location'}</Text>
        <Ionicons name="chevron-down" size={17} color={MUTED}/>
      </Pressable>
      <Text style={s.helper}>Choose from locations set by BRB Admins.</Text>{errorText(errors.pickup)}

      <Pressable onPress={() => {setOwnership(v => !v); setErrors(e => ({...e,ownership:undefined}));}} style={s.ownershipRow}><View style={[s.checkbox,ownership && s.checkboxChecked,showErrors && errors.ownership && s.checkboxError]}>{ownership && <Ionicons name="checkmark" size={15} color={WHITE}/>}</View><Text style={s.ownershipText}>I confirm that I own this item or have the right to lend it.</Text></Pressable>{errorText(errors.ownership)}
      <Pressable style={[s.postButton, saving && { opacity: 0.6 }]} onPress={postItem} disabled={saving}><Text style={s.postText}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Post Item'}</Text></Pressable>{!editing && <Pressable style={s.draftButton} onPress={saveDraft}><Text style={s.draftText}>{draftSaved ? 'Save Draft ✓' : 'Save Draft'}</Text></Pressable>}
    </ScrollView>

    <Modal transparent visible={dropdown === 'pickup'} animationType="slide" onRequestClose={() => setDropdown(null)}>
      <Pressable style={s.modalBackdrop} onPress={() => setDropdown(null)}>
        <Pressable style={s.bottomSheet} onPress={() => {}}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Pickup Location</Text>
          <Text style={s.sheetDescription}>Pick where you’ll hand the item over. Locations are set by BRB Admins.</Text>
          <ScrollView style={s.sheetOptions} showsVerticalScrollIndicator={false}>
            {PICKUP_LOCATIONS.map(({ name: item, detail: subtitle }) => {
              const selected = pickup === item;

              return (
                <Pressable
                  key={item}
                  style={[s.sheetOption, selected && s.sheetOptionSelected]}
                  onPress={() => {
                    setPickup(item);
                    setErrors(e => ({ ...e, pickup: undefined }));
                    setDropdown(null);
                  }}
                >
                  <View style={[s.radioOuter, selected && s.radioOuterSelected]}>
                    {selected && <View style={s.radioInner} />}
                  </View>
                  <View style={s.sheetOptionCopy}>
                    <Text style={s.sheetOptionTitle}>{item}</Text>
                    <Text style={s.sheetOptionSubtitle}>{subtitle}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={s.sheetButtons}>
            <Pressable style={s.sheetCancel} onPress={() => setDropdown(null)}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={s.sheetConfirm} onPress={() => setDropdown(null)}>
              <Text style={s.sheetConfirmText}>Select</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:BG},
  header:{
    backgroundColor: colors.primary,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerSpacer:{width:32,alignItems:'flex-start'},
  headerActionSpacer:{width:32},
  headerTitle:{flex:1, textAlign:'center', color: colors.white, fontSize: 18, fontWeight:'700'},
  scroll:{flex:1},content:{paddingHorizontal:20,paddingTop:16,paddingBottom:30},
  banner:{flexDirection:'row',alignItems:'center',gap:8,padding:12,borderWidth:1,borderColor:ERROR,borderRadius:11,backgroundColor:'#FFF5F6',marginBottom:14},bannerText:{flex:1,color:'#9E3B49',fontSize:12},bannerStrong:{fontWeight:'800'},label:{color:TEXT,fontSize:12,fontWeight:'700',marginTop:15,marginBottom:8},smallLabel:{color:TEXT,fontSize:12,fontWeight:'700',marginBottom:7},required:{color:ERROR},
  photoRow:{flexDirection:'row',alignItems:'flex-start',gap:8,flexWrap:'wrap'},photoTile:{width:72,height:76,borderRadius:9,borderWidth:1,borderColor:BORDER,backgroundColor:WHITE,alignItems:'center',justifyContent:'center',overflow:'hidden'},photoImage:{width:'100%',height:'100%'},photoName:{position:'absolute',bottom:2,left:2,right:2,textAlign:'center',fontSize:8,color:WHITE,backgroundColor:'rgba(0,0,0,0.5)'},removePhoto:{position:'absolute',right:1,top:1,backgroundColor:WHITE,borderRadius:12},addTile:{borderStyle:'dashed'},photoCaption:{color:MUTED,fontSize:10,marginTop:3},helper:{color:MUTED,fontSize:10.5,marginTop:7,lineHeight:15},errorRow:{flexDirection:'row',alignItems:'center',gap:5,marginTop:4},errorText:{flex:1,color:ERROR,fontSize:10.5,lineHeight:15},
  categoryDropdownWrap:{position:'relative',zIndex:10},categoryMenu:{position:'absolute',top:49,left:0,right:0,backgroundColor:WHITE,borderWidth:1,borderColor:BORDER,borderRadius:8,elevation:8,shadowColor:'#000',shadowOpacity:0.12,shadowRadius:8,shadowOffset:{width:0,height:4},zIndex:20,overflow:'hidden'},categoryMenuOption:{minHeight:43,paddingHorizontal:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#EDF0F5'},categoryMenuOptionSelected:{backgroundColor:'#FFF5F5'},categoryMenuText:{color:TEXT,fontSize:13},categoryMenuTextSelected:{color:RED,fontWeight:'700'},input:{minHeight:47,borderRadius:8,borderWidth:1,borderColor:BORDER,backgroundColor:WHITE,paddingHorizontal:13,paddingVertical:11,color:TEXT,fontSize:13},inputError:{borderColor:ERROR,borderWidth:1.3},select:{minHeight:47,borderRadius:8,borderWidth:1,borderColor:BORDER,backgroundColor:WHITE,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:8},selectText:{flex:1,color:TEXT,fontSize:13},placeholder:{color:'#A5AFC1'},chipsWrap:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:8},chip:{borderWidth:1,borderColor:BORDER,borderRadius:18,backgroundColor:WHITE,paddingHorizontal:12,paddingVertical:8},wideChip:{},chipSelected:{backgroundColor:RED,borderColor:RED},chipText:{color:TEXT,fontSize:11},chipTextSelected:{color:WHITE,fontWeight:'600'},description:{minHeight:80,maxHeight:130,textAlignVertical:'top'},counter:{color:MUTED,fontSize:10.5,marginTop:5},chipRow:{flexDirection:'row',flexWrap:'wrap',gap:7},segmentRow:{flexDirection:'row',gap:8},segment:{flex:1,minHeight:38,borderWidth:1,borderColor:BORDER,borderRadius:22,backgroundColor:WHITE,justifyContent:'center',alignItems:'center',paddingHorizontal:7},segmentSelected:{backgroundColor:RED,borderColor:RED},segmentText:{color:TEXT,fontSize:11.5,fontWeight:'500'},segmentTextSelected:{color:WHITE},
  modalBackdrop:{flex:1,backgroundColor:'rgba(20,25,38,0.48)',justifyContent:'flex-end'},bottomSheet:{backgroundColor:WHITE,borderTopLeftRadius:20,borderTopRightRadius:20,paddingHorizontal:18,paddingTop:8,paddingBottom:22,maxHeight:'76%'},sheetHandle:{alignSelf:'center',width:42,height:4,borderRadius:4,backgroundColor:BORDER,marginBottom:12},sheetTitle:{fontSize:16,fontWeight:'700',color:'#20283A',marginBottom:7},sheetDescription:{fontSize:11,color:MUTED,lineHeight:16,marginBottom:13},sheetOptions:{maxHeight:320},sheetOption:{minHeight:52,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:10,paddingVertical:8,borderWidth:1,borderColor:'#EEF1F5',borderRadius:9,marginBottom:6,backgroundColor:WHITE},sheetOptionSelected:{borderColor:'#F2B3B6',backgroundColor:'#FFF9F9'},radioOuter:{width:16,height:16,borderRadius:9,borderWidth:1.3,borderColor:BORDER,alignItems:'center',justifyContent:'center'},radioOuterSelected:{borderColor:RED},radioInner:{width:8,height:8,borderRadius:5,backgroundColor:RED},sheetOptionCopy:{flex:1},sheetOptionTitle:{fontSize:11.5,fontWeight:'700',color:'#30394D'},sheetOptionSubtitle:{fontSize:10,color:MUTED,marginTop:2},sheetButtons:{flexDirection:'row',gap:8,marginTop:10},sheetCancel:{flex:1,height:42,borderWidth:1,borderColor:RED,borderRadius:6,alignItems:'center',justifyContent:'center',backgroundColor:WHITE},sheetCancelText:{fontSize:12,fontWeight:'700',color:RED},sheetConfirm:{flex:1,height:42,borderRadius:6,alignItems:'center',justifyContent:'center',backgroundColor:RED},sheetConfirmText:{fontSize:12,fontWeight:'700',color:WHITE},
    dateRow:{flexDirection:'row',gap:10,marginTop:14},dateCol:{flex:1},dateInput:{minHeight:46,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:10,backgroundColor:WHITE,borderWidth:1,borderColor:BORDER,borderRadius:8},dateText:{flex:1,color:TEXT,fontSize:11.5,paddingVertical:8},ownershipRow:{flexDirection:'row',alignItems:'flex-start',gap:9,marginTop:18},checkbox:{width:19,height:19,borderRadius:4,borderWidth:1.5,borderColor:MUTED,backgroundColor:WHITE,alignItems:'center',justifyContent:'center'},checkboxChecked:{backgroundColor:RED,borderColor:RED},checkboxError:{borderColor:ERROR},ownershipText:{flex:1,color:TEXT,fontSize:12,lineHeight:18},postButton:{minHeight:48,borderRadius:8,backgroundColor:RED,alignItems:'center',justifyContent:'center',marginTop:16},postText:{color:WHITE,fontWeight:'700',fontSize:13},draftButton:{minHeight:48,borderRadius:8,borderWidth:1.2,borderColor:RED,backgroundColor:WHITE,alignItems:'center',justifyContent:'center',marginTop:12},draftText:{color:RED,fontWeight:'700',fontSize:13},
  gate:{flex:1,alignItems:'center',justifyContent:'center',padding:32,gap:12},gateTitle:{fontSize:17,fontWeight:'700',color:TEXT,textAlign:'center'},gateBody:{fontSize:13,color:MUTED,textAlign:'center',lineHeight:19},gateButton:{alignSelf:'stretch',paddingHorizontal:16}
});
