// OWNER: Danielo | Additional Ticket: Home Page Refinement
// Refine homepage layout & replace hardcoded listings with live database data.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing, text } from '../../../theme';
import { VerifiedLabel, AffiliationType } from '../../../shared/components';
import { searchListings } from '../../search/services/searchListings';
import { EMPTY_FILTERS, Listing } from '../../search/types';

/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  {
    label: 'Textbooks',
    icon: 'book-outline' as const,
  },
  {
    label: 'Electronics',
    icon: 'calculator-outline' as const,
  },
  {
    label: 'Lab Equipment',
    icon: 'flask-outline' as const,
  },
  {
    label: 'Notes',
    icon: 'documents-outline' as const,
  },
];

/* =========================================================
   FALLBACK MOCK LISTINGS (Used when offline or DB empty)
========================================================= */

interface DisplayListing {
  id: string;
  title: string;
  owner: string;
  ownerId?: string;
  affiliation?: AffiliationType;
  verified: boolean;
  location: string;
  price: string;
  rating: string;
  image: string;
  photos?: string[];
  category?: string;
  availableFrom?: string;
  availableTo?: string;
}

const fallbackListings: DisplayListing[] = [
  {
    id: '1',
    title: 'Laptop (i5 8th Gen)',
    owner: 'Jen Sta. Ana',
    affiliation: 'Student',
    verified: true,
    location: 'PUP CEA, Sta. Mesa, Manila',
    price: 'FREE',
    rating: '4.12',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
    photos: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900',
      'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=900',
    ],
    category: 'Electronics',
  },
  {
    id: '2',
    title: 'Concepts of Programming...',
    owner: 'Lawrence Aragon',
    affiliation: 'Faculty',
    verified: true,
    location: 'South, 5th Floor, PUP Main',
    price: '₱15 / day',
    rating: '4.80',
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600',
    category: 'Textbooks',
  },
  {
    id: '3',
    title: 'T-Square',
    owner: 'J.B. Sucat',
    affiliation: 'Student',
    verified: true,
    location: 'PUP CEA, Sta. Mesa, Manila',
    price: '₱10 / day',
    rating: '3.96',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600',
    category: 'Lab Equipment',
  },
  {
    id: '4',
    title: 'Erlenmeyer Flask (250ml)',
    owner: 'Kim Santos',
    affiliation: 'Faculty',
    verified: true,
    location: 'South, 6th Floor, PUP Main',
    price: '₱5 / day',
    rating: '3.88',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600',
    category: 'Lab Equipment',
  },
  {
    id: '5',
    title: 'Yantok (For Arnis)',
    owner: 'Shan Adalman',
    affiliation: 'Staff',
    verified: true,
    location: 'CHK, PUP Main',
    price: 'FREE',
    rating: '4.20',
    image: 'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=600',
    category: 'School Supplies',
  },
];

type HomeFilter = 'all' | 'available' | 'free' | 'rent';

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen({ navigation }: any) {
  const [items, setItems] = useState<DisplayListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HomeFilter>('all');

  // Convert API Listing to DisplayListing
  const mapApiListing = (l: Listing): DisplayListing => {
    const isFree = !l.price || l.price.toUpperCase().includes('FREE') || l.price === '₱0' || l.price === '0';
    const displayPrice = isFree
      ? 'FREE'
      : l.price?.includes('day') || l.price?.includes('/')
      ? l.price
      : `${l.price} / day`;

    return {
      id: l.id,
      title: l.title,
      owner: l.ownerName || 'BRB Lender',
      ownerId: l.ownerId,
      affiliation: 'Student',
      verified: l.ownerVerified,
      location: l.location || 'PUP Main Campus',
      price: displayPrice,
      rating: l.rating > 0 ? l.rating.toFixed(2) : '5.00',
      image: l.imageUrl || l.photos?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
      photos: l.photos,
      category: l.category,
      availableFrom: l.availableFrom,
      availableTo: l.availableTo,
    };
  };

  const loadListings = useCallback(async () => {
    try {
      const res = await searchListings({
        keyword: '',
        sort: 'newest',
        page: 1,
        pageSize: 20,
        filters: EMPTY_FILTERS,
      });

      if (res.items && res.items.length > 0) {
        setItems(res.items.map(mapApiListing));
      } else {
        setItems(fallbackListings);
      }
    } catch {
      setItems(fallbackListings);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    searchListings({
      keyword: '',
      sort: 'newest',
      page: 1,
      pageSize: 20,
      filters: EMPTY_FILTERS,
    })
      .then((res) => {
        if (!active) return;
        if (res.items && res.items.length > 0) {
          setItems(res.items.map(mapApiListing));
        } else {
          setItems(fallbackListings);
        }
      })
      .catch(() => {
        if (active) setItems(fallbackListings);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const filteredListings = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.owner.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (activeFilter === 'available') {
        const today = new Date().toISOString().slice(0, 10);
        if (item.availableFrom && item.availableFrom > today) return false;
      } else if (activeFilter === 'free') {
        const isFree = item.price.toUpperCase().includes('FREE') || item.price === '₱0';
        if (!isFree) return false;
      } else if (activeFilter === 'rent') {
        const isFree = item.price.toUpperCase().includes('FREE') || item.price === '₱0';
        if (isFree) return false;
      }
      return true;
    });
  }, [items, searchQuery, activeFilter]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { keyword: searchQuery.trim() });
    } else {
      navigation.navigate('Search');
    }
  };

  const handleCategoryPress = (categoryLabel: string) => {
    navigation.navigate('Search', { category: categoryLabel });
  };

  const openItemDetail = (item: DisplayListing) => {
    navigation.navigate('ItemDetail', {
      item: {
        id: item.id,
        title: item.title,
        author: item.owner,
        lenderName: item.owner,
        lenderId: item.ownerId,
        lenderVerified: item.verified,
        affiliation: item.affiliation,
        image: item.image,
        photos: item.photos,
        price: item.price,
        location: item.location,
        rating: item.rating,
        category: item.category || 'General',
        availableFrom: item.availableFrom,
        availableTo: item.availableTo,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Borrow. Return. Borrow.</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.white} />
            <Text style={styles.location}>PUP Sta. Mesa, Manila</Text>
          </View>

          {/* ================= SEARCH ================= */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color="#9AA4B2" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search listings, textbooks, equipment..."
              placeholderTextColor="#9AA4B2"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#9AA4B2" />
              </Pressable>
            ) : null}
          </View>

          {/* ================= FILTERS ================= */}
          <View style={styles.filters}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'available', label: 'Available Now' },
                { key: 'free', label: 'Free' },
                { key: 'rent', label: 'For Rent' },
              ] as const
            ).map((f) => {
              const active = activeFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[styles.filterButton, active && styles.filterButtonActive]}
                  onPress={() => setActiveFilter(f.key)}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* =================================================
            CATEGORIES
        ================================================= */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAllText}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.categories}>
            {categories.map((category) => (
              <Pressable
                key={category.label}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category.label)}
                accessibilityRole="button"
                accessibilityLabel={`Category ${category.label}`}
              >
                <LinearGradient
                  colors={['#B2080C', '#81090B']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.categoryIcon}
                >
                  <Ionicons name={category.icon} size={28} color={colors.white} />
                </LinearGradient>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* =================================================
            DIVIDER
        ================================================= */}
        <View style={styles.sectionDivider} />

        {/* =================================================
            RECENTLY LISTED
        ================================================= */}
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recently Listed</Text>
            <Text style={styles.listingCount}>
              {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filter or search query.</Text>
              <Pressable
                style={styles.resetButton}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
              >
                <Text style={styles.resetButtonText}>Reset filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredListings.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => openItemDetail(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.price}`}
                >
                  {/* IMAGE */}
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  {/* TITLE */}
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  {/* OWNER */}
                  <View style={{ marginVertical: 3 }}>
                    <VerifiedLabel
                      name={item.owner}
                      affiliation={item.affiliation}
                      verified={item.verified}
                      compact
                    />
                  </View>

                  {/* LOCATION */}
                  <Text style={styles.productLocation} numberOfLines={1}>
                    {item.location}
                  </Text>

                  {/* PRICE + RATING */}
                  <View style={styles.cardBottom}>
                    <Text style={styles.price}>{item.price}</Text>
                    <View style={styles.rating}>
                      <Ionicons name="star" size={11} color={colors.gold} />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* =================================================
            REPORT LINK
        ================================================= */}
        <Pressable
          style={styles.reportButton}
          onPress={() => navigation.navigate('Search')}
          accessibilityRole="button"
        >
          <Ionicons name="help-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.reportText}>Looking for something else? Browse all items</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
  },
  scrollContent: {
    width: '100%',
    paddingBottom: spacing.xxl,
  },

  /* HEADER */
  header: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 68,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  location: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },

  /* SEARCH BAR */
  searchContainer: {
    width: '100%',
    height: 42,
    backgroundColor: colors.white,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    marginLeft: 8,
    paddingVertical: 0,
  },

  /* FILTERS */
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonActive: {
    backgroundColor: colors.white,
  },
  filterText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* CATEGORIES */
  categorySection: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  categories: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#81090B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* DIVIDER */
  sectionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  /* RECENTLY LISTED */
  listingsSection: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  listingCount: {
    color: colors.textMuted,
    fontSize: 12,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  /* PRODUCT CARD */
  card: {
    width: '48.2%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginBottom: 6,
  },
  productTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 2,
  },
  productLocation: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  price: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 6,
  },
  emptyTitle: {
    ...text.title,
    fontSize: 15,
    color: colors.text,
  },
  emptySubtitle: {
    ...text.caption,
    color: colors.textMuted,
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  /* REPORT LINK */
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 24,
    paddingVertical: 8,
  },
  reportText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
