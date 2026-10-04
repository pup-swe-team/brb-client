import React, { useState } from 'react';

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../../theme';


/* =========================================================
   TYPES
========================================================= */

type Item = {
  id: string;
  title: string;
  lender: string;
  location: string;
  price: string;
  rating: string;
  image: string;
};


/* =========================================================
   MOCK ITEMS
========================================================= */

const items: Item[] = [
  {
    id: '1',
    title: 'Transfer and Business Taxation',
    lender: 'Mark Anthony Cruz',
    location: 'West, 4th Floor, PUP Main',
    price: 'FREE',
    rating: '0.00',
    image:
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
  },
  {
    id: '2',
    title: 'Lab Coat (MEDIUM)',
    lender: 'Gwen Tempiosa',
    location: 'South, 6th Floor, PUP Main',
    price: 'FREE',
    rating: '4.30',
    image:
      'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800',
  },
  {
    id: '3',
    title: 'Safety Hat (Orange)',
    lender: 'Ella Napomuceno',
    location: 'PUP OJA, 5th, Main, Manila',
    price: '₱20 day',
    rating: '0.00',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  },
  {
    id: '4',
    title: 'Basic Calculator',
    lender: 'Rikki Rodriguez',
    location: 'West, 4th Floor, PUP Main',
    price: '₱8 day',
    rating: '0.00',
    image:
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800',
  },
];


/* =========================================================
   SEARCH SCREEN
========================================================= */

export default function SearchScreen({
  navigation,
}: any) {

  const [search, setSearch] = useState('');

  const [showSortMenu, setShowSortMenu] =
    useState(false);

  const [showFilter, setShowFilter] =
    useState(false);

  const [showRequest, setShowRequest] =
    useState(false);

  const [sortType, setSortType] =
    useState('by Title');

  const [selectedLocation, setSelectedLocation] =
    useState('');

  const [selectedRating, setSelectedRating] =
    useState('');

  const [minimumPrice, setMinimumPrice] =
    useState('');

  const [maximumPrice, setMaximumPrice] =
    useState('');

  const [filterCategory, setFilterCategory] =
    useState('Lender Location');

  const [message, setMessage] =
    useState('');

  const [selectedProgram, setSelectedProgram] =
    useState('');


  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  const filteredItems = items.filter((item) => {

    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      item.title.toLowerCase().includes(keyword) ||
      item.lender.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword)
    );
  });


  return (
    <View style={styles.screen}>

      {/* ===================================================
          HEADER
      =================================================== */}

      <View style={styles.header}>

        <Text style={styles.headerTitle}>
          Search Results (Resource Listing)
        </Text>

      </View>


      {/* ===================================================
          SEARCH SECTION
      =================================================== */}

      <View style={styles.searchSection}>

        {/* BACK */}

        <Pressable
          style={styles.backButton}
          onPress={() =>
            navigation.navigate('Home')
          }
        >

          <Ionicons
            name="chevron-back"
            size={29}
            color={colors.primaryDark}
          />

        </Pressable>


        {/* SEARCH */}

        <View style={styles.searchContainer}>

          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textMuted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />

        </View>


        {/* FILTER */}

        <Pressable
          style={styles.filterButton}
          onPress={() => {
            setShowSortMenu(false);
            setShowFilter(true);
          }}
        >

          <Ionicons
            name="filter-outline"
            size={25}
            color={colors.primary}
          />

          <Text style={styles.filterText}>
            Filter
          </Text>

        </Pressable>

      </View>


      {/* ===================================================
          SORT ROW
      =================================================== */}

      <View style={styles.sortRow}>

        <Pressable
          style={styles.sortLeft}
          onPress={() =>
            setShowSortMenu(!showSortMenu)
          }
        >

          <Ionicons
            name="swap-vertical-outline"
            size={19}
            color={colors.primaryDark}
          />

          <Text style={styles.sortText}>
            Sort in Descending Order
          </Text>

        </Pressable>


        <Pressable
          style={styles.sortRight}
          onPress={() =>
            setShowSortMenu(!showSortMenu)
          }
        >

          <Text style={styles.sortByText}>
            {sortType}
          </Text>

          <Ionicons
            name="caret-down"
            size={12}
            color={colors.primaryDark}
          />

        </Pressable>

      </View>


      {/* ===================================================
          SORT DROPDOWN
      =================================================== */}

      {showSortMenu && (

        <View style={styles.sortMenu}>

          <Text style={styles.menuTitle}>
            Sorting Category...
          </Text>

          {[
            'by Title',
            'by Author',
            'by Publication Date',
            'by Relevance',
            'by Ratings',
          ].map((item) => (

            <Pressable
              key={item}
              style={styles.menuItem}
              onPress={() => {
                setSortType(item);
                setShowSortMenu(false);
              }}
            >

              <Text style={styles.menuText}>
                {item}
              </Text>

            </Pressable>

          ))}

        </View>

      )}


      {/* ===================================================
          RESULTS
      =================================================== */}

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >

        {filteredItems.length > 0 ? (

          <View style={styles.grid}>

            {filteredItems.map((item) => (

              /*
               * IMPORTANT:
               * This Pressable is what makes the
               * resource card clickable.
               */

              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.itemCard,
                  pressed && styles.itemCardPressed,
                ]}
                onPress={() => {
  setShowSortMenu(false);
}}
              >

                {/* ITEM IMAGE */}

                <View
                  style={styles.imageContainer}
                >

                  <Image
                    source={{
                      uri: item.image,
                    }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />

                </View>


                {/* TITLE */}

                <Text
                  style={styles.itemTitle}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>


                {/* LENDER */}

                <Text
                  style={styles.itemLender}
                  numberOfLines={1}
                >
                  {item.lender}
                </Text>


                {/* LOCATION */}

                <Text
                  style={styles.itemLocation}
                  numberOfLines={2}
                >
                  {item.location}
                </Text>


                {/* PRICE + RATING */}

                <View style={styles.itemBottom}>

                  <Text style={styles.itemPrice}>
                    {item.price}
                  </Text>

                  <View style={styles.ratingContainer}>

                    <Ionicons
                      name="star"
                      size={14}
                      color={colors.gold}
                    />

                    <Text
                      style={styles.ratingText}
                    >
                      {item.rating}
                    </Text>

                  </View>

                </View>

              </Pressable>

            ))}

          </View>

        ) : (

          <View style={styles.noResults}>

            <Ionicons
              name="search-outline"
              size={38}
              color={colors.textMuted}
            />

            <Text style={styles.noResultsText}>
              No resources found.
            </Text>

          </View>

        )}


        {/* =================================================
            REQUEST LINK
        ================================================= */}

        <View style={styles.requestArea}>

          <Text style={styles.emptyText}>
            Can't find what you're looking for?{' '}
          </Text>

          <Pressable
            onPress={() => {
              setShowSortMenu(false);
              setShowRequest(true);
            }}
          >

            <Text style={styles.requestText}>
              Send in a request!
            </Text>

          </Pressable>

        </View>

      </ScrollView>


      {/* ===================================================
          FILTER MODAL
      =================================================== */}

      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowFilter(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.filterModal}>

            {/* LEFT SIDEBAR */}

            <View style={styles.filterSidebar}>

              {[
                'Lender Location',
                'Rating',
                'Price Range',
                'Claiming Options',
              ].map((item) => (

                <Pressable
                  key={item}
                  style={styles.sidebarItem}
                  onPress={() =>
                    setFilterCategory(item)
                  }
                >

                  <Text
                    style={[
                      styles.sidebarText,
                      filterCategory === item &&
                        styles.sidebarTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                </Pressable>

              ))}

            </View>


            {/* RIGHT CONTENT */}

            <ScrollView
              style={styles.filterContent}
              contentContainerStyle={
                styles.filterContentInner
              }
              showsVerticalScrollIndicator={false}
            >

              {filterCategory ===
                'Lender Location' && (

                <>
                  <Text
                    style={styles.filterHeading}
                  >
                    Lender Locations
                  </Text>

                  <View
                    style={styles.optionGrid}
                  >

                    {[
                      'Near You',
                      'Near Campus',
                      'Pasay City',
                      'SM Aura Premier',
                    ].map((location) => (

                      <Pressable
                        key={location}
                        style={[
                          styles.optionButton,
                          selectedLocation ===
                            location &&
                            styles.optionSelected,
                        ]}
                        onPress={() =>
                          setSelectedLocation(
                            location
                          )
                        }
                      >

                        <Text
                          style={
                            styles.optionText
                          }
                        >
                          {location}
                        </Text>

                      </Pressable>

                    ))}

                  </View>
                </>

              )}


              {filterCategory ===
                'Rating' && (

                <>
                  <Text
                    style={styles.filterHeading}
                  >
                    Rating
                  </Text>

                  <View
                    style={styles.optionGrid}
                  >

                    {[
                      '1 Star',
                      '2 Stars',
                      '3 Stars',
                      '4 Stars',
                      '5 Stars',
                    ].map((rating) => (

                      <Pressable
                        key={rating}
                        style={[
                          styles.optionButton,
                          selectedRating ===
                            rating &&
                            styles.optionSelected,
                        ]}
                        onPress={() =>
                          setSelectedRating(
                            rating
                          )
                        }
                      >

                        <Text
                          style={
                            styles.optionText
                          }
                        >
                          {rating}
                        </Text>

                      </Pressable>

                    ))}

                  </View>
                </>

              )}


              {filterCategory ===
                'Price Range' && (

                <>
                  <Text
                    style={styles.filterHeading}
                  >
                    Price Range
                  </Text>

                  <View
                    style={styles.priceRow}
                  >

                    <TextInput
                      value={minimumPrice}
                      onChangeText={
                        setMinimumPrice
                      }
                      placeholder="Minimum"
                      placeholderTextColor={
                        colors.textMuted
                      }
                      keyboardType="numeric"
                      style={styles.priceInput}
                    />

                    <Text
                      style={styles.priceDash}
                    >
                      -
                    </Text>

                    <TextInput
                      value={maximumPrice}
                      onChangeText={
                        setMaximumPrice
                      }
                      placeholder="Maximum"
                      placeholderTextColor={
                        colors.textMuted
                      }
                      keyboardType="numeric"
                      style={styles.priceInput}
                    />

                  </View>
                </>

              )}


              {filterCategory ===
                'Claiming Options' && (

                <>
                  <Text
                    style={styles.filterHeading}
                  >
                    Claiming Options
                  </Text>

                  <View
                    style={styles.optionGrid}
                  >

                    {[
                      'Pickup',
                      'Meet-up',
                      'Delivery',
                    ].map((option) => (

                      <Pressable
                        key={option}
                        style={
                          styles.optionButton
                        }
                      >

                        <Text
                          style={
                            styles.optionText
                          }
                        >
                          {option}
                        </Text>

                      </Pressable>

                    ))}

                  </View>
                </>

              )}

            </ScrollView>


            {/* BUTTONS */}

            <View
              style={styles.actionButtons}
            >

              <Pressable
                style={styles.cancelButton}
                onPress={() =>
                  setShowFilter(false)
                }
              >

                <Text style={styles.cancelText}>
                  Cancel
                </Text>

              </Pressable>


              <Pressable
                style={styles.applyButton}
                onPress={() =>
                  setShowFilter(false)
                }
              >

                <Text style={styles.applyText}>
                  Filter
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>


      {/* ===================================================
          RESOURCE REQUEST MODAL
      =================================================== */}

      <Modal
        visible={showRequest}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowRequest(false)
        }
      >

        <View style={styles.requestOverlay}>

          <View style={styles.requestCard}>

            <LinearGradient
              colors={[
                'rgba(245,179,1,0.42)',
                'rgba(245,179,1,0.28)',
                'rgba(123,17,19,0.42)',
              ]}
              locations={[
                0.09,
                0.40,
                0.71,
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.requestGlass}
            >

              {/* TITLE */}

              <Text
                style={styles.requestTitle}
              >
                Resource Request Form
              </Text>


              {/* RESOURCE CARD */}

              <View
                style={styles.resourceCard}
              >

                <View
                  style={styles.resourceIcon}
                >

                  <Ionicons
                    name="book-outline"
                    size={24}
                    color={colors.white}
                  />

                </View>

                <View
                  style={styles.resourceInfo}
                >

                  <Text
                    style={
                      styles.resourceTitle
                    }
                  >
                    Resource Title Here
                  </Text>

                  <Text
                    style={
                      styles.resourceDetails
                    }
                  >
                    Lender: Lender's Name Here
                  </Text>

                  <Text
                    style={
                      styles.resourceDetails
                    }
                  >
                    Available for up to XYZ days
                  </Text>

                </View>

              </View>


              {/* PROGRAM */}

              <Text
                style={styles.fieldTitle}
              >
                For what program is this resource?
              </Text>

              <Text
                style={
                  styles.fieldDescription
                }
              >
                Please choose the corresponding program
              </Text>

              <Pressable
                style={styles.programInput}
                onPress={() =>
                  setSelectedProgram(
                    selectedProgram ===
                      'Computer Science'
                      ? ''
                      : 'Computer Science'
                  )
                }
              >

                <Text
                  style={[
                    styles.placeholderText,
                    selectedProgram &&
                      styles.selectedProgramText,
                  ]}
                >
                  {selectedProgram ||
                    'Select Program'}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textMuted}
                />

              </Pressable>


              {/* MESSAGE */}

              <Text
                style={styles.fieldTitle}
              >
                Add a message (Optional)
              </Text>

              <Text
                style={
                  styles.fieldDescription
                }
              >
                Introduce yourself or explain why you need it
              </Text>

              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                placeholder="Hello po! I need this item because..."
                placeholderTextColor={
                  colors.textMuted
                }
                style={styles.messageInput}
              />


              {/* BUTTONS */}

              <View
                style={styles.requestButtons}
              >

                <Pressable
                  style={styles.requestCancel}
                  onPress={() =>
                    setShowRequest(false)
                  }
                >

                  <Text
                    style={
                      styles.requestCancelText
                    }
                  >
                    Cancel
                  </Text>

                </Pressable>


                <Pressable
                  style={
                    styles.sendRequestButton
                  }
                  onPress={() => {
                    setShowRequest(false);
                  }}
                >

                  <Text
                    style={
                      styles.sendRequestText
                    }
                  >
                    Send Request
                  </Text>

                </Pressable>

              </View>

            </LinearGradient>

          </View>

        </View>

      </Modal>

    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* SCREEN */

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },


  /* HEADER */

  header: {
    width: '100%',
    height: 103,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 13,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },


  /* SEARCH */

  searchSection: {
    width: '100%',
    height: 60,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },

  backButton: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchContainer: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 10,
    marginLeft: 7,
    paddingVertical: 0,
  },

  filterButton: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterText: {
    color: colors.primaryDark,
    fontSize: 8,
    marginTop: 1,
  },


  /* SORT */

  sortRow: {
    width: '100%',
    height: 34,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },

  sortLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  sortText: {
    color: colors.primaryDark,
    fontSize: 9,
  },

  sortRight: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 24,
    borderLeftWidth: 1,
    borderLeftColor: colors.primary,
  },

  sortByText: {
    color: colors.primaryDark,
    fontSize: 9,
  },


  /* SORT MENU */

  sortMenu: {
    position: 'absolute',
    top: 197,
    right: 15,
    width: 145,
    backgroundColor: colors.white,
    borderRadius: 5,
    paddingVertical: 5,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  menuTitle: {
    color: colors.textSecondary,
    fontSize: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  menuItem: {
    minHeight: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  menuText: {
    color: colors.primaryDark,
    fontSize: 8,
  },


  /* RESULTS */

  resultsScroll: {
    flex: 1,
  },

  resultsContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 110,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },

  itemCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 8,
    overflow: 'hidden',
  },

  itemCardPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  imageContainer: {
    width: '100%',
    height: 170,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },

  itemImage: {
    width: '100%',
    height: '100%',
  },

  itemTitle: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    lineHeight: 15,
  },

  itemLender: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 7,
  },

  itemLocation: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
    lineHeight: 13,
  },

  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingBottom: 5,
  },

  itemPrice: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  ratingText: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '600',
  },


  /* NO RESULTS */

  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },

  noResultsText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },


  /* REQUEST LINK */

  requestArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },

  requestText: {
    color: colors.primaryDark,
    fontSize: 10,
    textDecorationLine: 'underline',
  },


  /* FILTER MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  filterModal: {
  position: 'absolute',
  top: 55,
  width: '90%',
  height: 400,
  backgroundColor: colors.white,
  borderRadius: 8,
  flexDirection: 'row',
  overflow: 'visible',
},

  filterSidebar: {
    width: '34%',
    borderRightWidth: 1,
    borderRightColor: '#BFC5D1',
  },

  sidebarItem: {
    minHeight: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#BFC5D1',
    paddingHorizontal: 5,
  },

  sidebarText: {
    color: '#9AA4B8',
    fontSize: 9,
    textAlign: 'center',
  },

  sidebarTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  filterContent: {
    flex: 1,
  },

  filterContentInner: {
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 70,
  },

  filterHeading: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 7,
    marginBottom: 17,
  },

  optionButton: {
    width: '48%',
    height: 32,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionSelected: {
    backgroundColor: '#FBE6E7',
  },

  optionText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },

  priceRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  priceInput: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 11,
    color: colors.text,
    backgroundColor: colors.white,
  },

  priceDash: {
    color: colors.textMuted,
    fontSize: 10,
  },

  actionButtons: {
  position: 'absolute',
  left: 42,
  right: 42,
  bottom: -22,
  flexDirection: 'row',
  gap: 12,
},

  cancelButton: {
    flex: 1,
    height: 40,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },

  applyButton: {
    flex: 1,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },


  /* REQUEST MODAL */

  requestOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,45,45,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  requestCard: {
    width: '78%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    elevation: 16,
    transform: [
      {
        translateY: 28,
      },
    ],
  },

  requestGlass: {
    width: '100%',
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 14,
    borderRadius: 18,
  },

  requestTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },

  resourceCard: {
    width: '100%',
    minHeight: 70,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    marginBottom: 23,
  },

  resourceIcon: {
    width: 27,
    height: 27,
    borderRadius: 7,
    backgroundColor: '#F4B900',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  resourceInfo: {
    flex: 1,
  },

  resourceTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },

  resourceDetails: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 9,
    lineHeight: 13,
  },

  fieldTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },

  fieldDescription: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 8,
    marginBottom: 5,
  },

  programInput: {
    width: '100%',
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
    marginBottom: 27,
  },

  placeholderText: {
    color: colors.textMuted,
    fontSize: 9,
  },

  selectedProgramText: {
    color: colors.text,
  },

  messageInput: {
    width: '100%',
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    color: colors.text,
    fontSize: 9,
    marginBottom: 26,
  },

  requestButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },

  requestCancel: {
    flex: 1,
    height: 38,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  requestCancelText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },

  sendRequestButton: {
    flex: 1,
    height: 38,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendRequestText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },

});