import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, spacing } from '../../../theme';


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
   RECENTLY LISTED
========================================================= */

const listings = [
  {
    id: '1',
    title: 'Laptop (i5 8th Gen)',
    owner: 'Jen Sta. Ana',
    location: 'PUP CEA, Sta. Mesa, Manila',
    price: 'FREE',
    rating: '4.12',
    image:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
  },
  {
    id: '2',
    title: 'Concepts of Programming...',
    owner: 'Lawrence Aragon',
    location: 'South, 5th Floor, PUP Main',
    price: '₱15 day',
    rating: '4.80',
    image:
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600',
  },
  {
    id: '3',
    title: 'T-Square',
    owner: 'J.B. Sucat',
    location: 'PUP CEA, Sta. Mesa, Manila',
    price: '₱10 day',
    rating: '3.96',
    image:
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600',
  },
  {
    id: '4',
    title: 'Erlenmeyer Flask (250ml)',
    owner: 'Kim Santos',
    location: 'South, 6th Floor, PUP Main',
    price: '₱5 day',
    rating: '3.88',
    image:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600',
  },
  {
    id: '5',
    title: 'Yantok (For Arnis)',
    owner: 'Shan Adalman',
    location: 'CHK, PUP Main',
    price: 'FREE',
    rating: '4.20',
    image:
      'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?w=600',
  },
];


/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.screen}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <Text style={styles.headerTitle}>
            Borrow. Return. Borrow.
          </Text>

          <Text style={styles.location}>
            Sta. Mesa, Manila
          </Text>


          {/* ================= SEARCH ================= */}

          <View style={styles.searchContainer}>

            <Ionicons
              name="search-outline"
              size={14}
              color="#9AA4B2"
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#9AA4B2"
            />

          </View>


          {/* ================= FILTERS ================= */}

          <View style={styles.filters}>

            <Pressable style={styles.filterButton}>
              <Text style={styles.filterText}>
                Available Now
              </Text>
            </Pressable>

            <Pressable style={styles.filterButton}>
              <Text style={styles.filterText}>
                Near Me
              </Text>
            </Pressable>

            <Pressable style={styles.filterButton}>
              <Text style={styles.filterText}>
                Free
              </Text>
            </Pressable>

            <Pressable style={styles.filterButton}>
              <Text style={styles.filterText}>
                For Rent
              </Text>
            </Pressable>

          </View>

        </View>


        {/* =================================================
            CATEGORIES
        ================================================= */}

        <View style={styles.categorySection}>

          <Text style={styles.sectionTitle}>
            Categories
          </Text>

          <View style={styles.categories}>

            {categories.map((category) => (
              <Pressable
                key={category.label}
                style={styles.categoryItem}
                onPress={() => navigation.navigate('Search')}
              >

                <LinearGradient
                  colors={['#B2080C', '#81090B']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.categoryIcon}
                >

                  <Ionicons
                    name={category.icon}
                    size={29}
                    color={colors.white}
                  />

                </LinearGradient>

                <Text style={styles.categoryLabel}>
                  {category.label}
                </Text>

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

          <Text style={styles.sectionTitle}>
            Recently Listed
          </Text>

          <View style={styles.grid}>

            {listings.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
              >

                {/* IMAGE */}

                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />


                {/* TITLE */}

                <Text
                  style={styles.productTitle}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>


                {/* OWNER */}

                <Text style={styles.owner}>
                  {item.owner}
                </Text>


                {/* LOCATION */}

                <Text
                  style={styles.productLocation}
                  numberOfLines={1}
                >
                  {item.location}
                </Text>


                {/* PRICE + RATING */}

                <View style={styles.cardBottom}>

                  <Text style={styles.price}>
                    {item.price}
                  </Text>

                  <View style={styles.rating}>

                    <Ionicons
                      name="star"
                      size={9}
                      color={colors.gold}
                    />

                    <Text style={styles.ratingText}>
                      {item.rating}
                    </Text>

                  </View>

                </View>

              </Pressable>
            ))}

          </View>

        </View>


        {/* =================================================
            REPORT
        ================================================= */}

        <Pressable style={styles.reportButton}>

          <Ionicons
            name="help-circle-outline"
            size={12}
            color={colors.textMuted}
          />

          <Text style={styles.reportText}>
            Report an issue?
          </Text>

        </Pressable>

      </ScrollView>

    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =====================================================
     SCREEN
  ===================================================== */

  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
  },

  scrollContent: {
    width: '100%',
    paddingBottom: spacing.lg,
  },


  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    width: '100%',
    backgroundColor: colors.primary,

    paddingHorizontal: 17,

    /*
     * Moved the header content lower.
     */
    paddingTop: 82,

    paddingBottom: 20,

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

 headerTitle: {
  color: colors.white,
  fontSize: 20,
  fontWeight: '700',
  marginBottom: 4,
},


 location: {
  color: colors.white,
  fontSize: 12,
  marginBottom: 15,
},

  /* =====================================================
     SEARCH
  ===================================================== */

  searchContainer: {
    width: '100%',
    height: 40,

    backgroundColor: colors.white,

    borderRadius: 7,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 10,
  },

  searchInput: {
  flex: 1,
  color: colors.text,
  fontSize: 11,
  marginLeft: 6,
  paddingVertical: 0,
},

  /* =====================================================
     FILTERS
  ===================================================== */

  filters: {
    flexDirection: 'row',

    alignItems: 'center',

    /*
     * Centers all four buttons.
     */
    justifyContent: 'center',

    /*
     * Space between each button.
     */
    gap: 9,

    marginTop: 13,
  },

  filterButton: {
    backgroundColor: colors.white,

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 6,
  },

 filterText: {
  color: colors.primary,
  fontSize: 9,
  fontWeight: '600',
},

  /* =====================================================
     CATEGORIES
  ===================================================== */

  categorySection: {
    width: '100%',

    paddingHorizontal: 17,

    paddingTop: 25,

    paddingBottom: 21,
  },

  sectionTitle: {
    color: colors.primaryDark,

    fontSize: 14,

    fontWeight: '700',

    marginBottom: 18,
  },

  categories: {
    width: '100%',

    flexDirection: 'row',

    justifyContent: 'space-between',

    paddingHorizontal: 4,
  },

  categoryItem: {
    width: '23%',

    alignItems: 'center',
  },


  /*
   * BIG CATEGORY CIRCLE
   *
   * Figma:
   * Top    = #B2080C
   * Bottom = #81090B
   */
  categoryIcon: {
    width: 58,
    height: 58,

    borderRadius: 29,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 7,

    shadowColor: '#81090B',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.25,

    shadowRadius: 2,

    elevation: 2,
  },

  categoryLabel: {
    color: colors.textSecondary,

    fontSize: 7,

    textAlign: 'center',
  },


  /* =====================================================
     DIVIDER BEFORE RECENTLY LISTED
  ===================================================== */

  sectionDivider: {
    width: '100%',

    height: 1,

    backgroundColor: '#E3E6EA',
  },


  /* =====================================================
     RECENTLY LISTED
  ===================================================== */

  listingsSection: {
    width: '100%',

    paddingHorizontal: 17,

    paddingTop: 17,
  },

  grid: {
    width: '100%',

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

    gap: 9,
  },


  /* =====================================================
     PRODUCT CARD
  ===================================================== */

  card: {
    width: '48.3%',

    backgroundColor: colors.white,

    borderWidth: 1,

    borderColor: colors.primary,

    borderRadius: 6,

    padding: 5,
  },

  productImage: {
    width: '100%',

    aspectRatio: 1,

    borderRadius: 6,

    borderWidth: 1,

    borderColor: colors.primary,

    marginBottom: 5,
  },

  productTitle: {
    color: colors.text,

    fontSize: 9,

    fontWeight: '600',

    marginBottom: 2,
  },

  owner: {
    color: colors.textMuted,

    fontSize: 7,

    marginBottom: 2,
  },

  productLocation: {
    color: colors.textMuted,

    fontSize: 7,

    marginBottom: 5,
  },

  cardBottom: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  price: {
    color: colors.primary,

    fontSize: 8,

    fontWeight: '700',
  },

  rating: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 2,
  },

  ratingText: {
    color: colors.gold,

    fontSize: 7,
  },


  /* =====================================================
     REPORT
  ===================================================== */

  reportButton: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 4,

    marginTop: 15,
  },

  reportText: {
    color: colors.textMuted,

    fontSize: 7,
  },

});