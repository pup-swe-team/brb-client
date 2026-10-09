import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';

export default function ItemDetailScreen({ navigation, route }: any) {
  const item = route?.params?.item ?? {};

  const title = item?.title || 'Concepts of Programming Languages';
  const author = item?.author || 'Tenth Edition by Robert W. Sebesta';
  const price = item?.price || '₱15 / day';
  const image =
    item?.image ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=900';

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
      />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          FOR RENT - Item Detailed
        </Text>
      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================
            ITEM IMAGE
        ===================================================== */}

        <View style={styles.imageSection}>
          <Image
            source={{ uri: image }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {/* BACK BUTTON */}

          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={36}
              color={colors.primaryDark}
            />
          </Pressable>

          {/* IMAGE COUNT */}

          <View style={styles.imageCount}>
            <Text style={styles.imageCountText}>1/1</Text>
          </View>

          {/* PRICE */}

          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {price}
            </Text>
          </View>

          {/* AVAILABLE */}

          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>
              Available
            </Text>
          </View>
        </View>

        {/* =====================================================
            ITEM TITLE
        ===================================================== */}

        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text
              style={styles.itemTitle}
              numberOfLines={1}
            >
              {title}
            </Text>

            <Pressable style={styles.bookmarkButton}>
              <Ionicons
                name="bookmark-outline"
                size={32}
                color={colors.primary}
              />
            </Pressable>
          </View>

          <Text style={styles.authorText}>
            {author}
          </Text>
        </View>

        {/* =====================================================
            PROGRAM
        ===================================================== */}

        <View style={styles.contentSection}>
          <View style={styles.programBadge}>
            <Text style={styles.programText}>
              COSC 302 - Principles of Programming Languages
            </Text>
          </View>

          {/* =================================================
              DATE
          ================================================= */}

          <View style={styles.dateCard}>
            <Text style={styles.dateTitle}>
              When do you need it?
            </Text>

            <View style={styles.dateRow}>
              <Pressable style={styles.dateBox}>
                <Text style={styles.dateLabel}>
                  Check-out
                </Text>

                <Text style={styles.addDate}>
                  Add date
                </Text>
              </Pressable>

              <Pressable style={styles.dateBox}>
                <Text style={styles.dateLabel}>
                  Return
                </Text>

                <Text style={styles.addDate}>
                  Add date
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =================================================
              ABOUT
          ================================================= */}

          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>
              About this Product
            </Text>

            <Text style={styles.detailText}>
              Detail 1: Mint Condition
            </Text>

            <Text style={styles.detailText}>
              Detail 2: Has sticky notes in some pages
            </Text>

            <Text style={styles.detailText}>
              Detail 3: NO Plastic Cover
            </Text>
          </View>

          {/* =================================================
              LENDER
          ================================================= */}

          <View style={styles.lenderCard}>
            <View style={styles.lenderAvatar}>
              <Ionicons
                name="person"
                size={28}
                color={colors.textMuted}
              />
            </View>

            <View style={styles.lenderInfo}>
              <View style={styles.lenderNameRow}>
                <Text style={styles.lenderName}>
                  Neo Ervine Y. Geroda
                </Text>

                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.lenderYear}>
                BSCS 3rd Year
              </Text>

              <View style={styles.ratingSmall}>
                <Text style={styles.starText}>
                  ★
                </Text>

                <Text style={styles.ratingText}>
                  4.8 (20 reviews)
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              DIVIDER
          ================================================= */}

          <View style={styles.divider} />

          {/* =================================================
              REVIEWS
          ================================================= */}

          <Text style={styles.sectionTitle}>
            Product Reviews <Text style={styles.reviewCount}>(6)</Text>
          </Text>

          <RatingRow
            label="Five"
            count={4}
            width="80%"
          />

          <RatingRow
            label="Four"
            count={1}
            width="25%"
          />

          <RatingRow
            label="Three"
            count={1}
            width="20%"
          />

          <RatingRow
            label="Two"
            count={0}
            width="0%"
          />

          <RatingRow
            label="One"
            count={0}
            width="0%"
          />

          <View style={styles.divider} />

          {/* =================================================
              RECENT FEEDBACKS
          ================================================= */}

          <Text style={styles.sectionTitle}>
            Recent Feedbacks
          </Text>

          <FeedbackCard
            name="Marvin Barrios"
            rating={4}
            message="Preferable if the book has protective cover, overall, good quality!"
          />

          <FeedbackCard
            name="Harold Patacsil"
            rating={3}
            message="Medyo may lukot on some pages when I got the book but it serves its purpose naman."
          />

          <FeedbackCard
            name="Kristine Patoc"
            rating={5}
            message="OMG, tysm! Mumtikan na ako ma-zero ni prof. kasi wala akong dalang book. 5/5!"
          />

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* =====================================================
          FIXED BOTTOM ACTION
      ===================================================== */}

      <View style={styles.bottomBar}>
        <Pressable style={styles.chatButton}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={28}
            color={colors.primary}
          />

          <Text style={styles.chatText}>
            Chat
          </Text>
        </Pressable>

        <Pressable
          style={styles.requestRentButton}
          onPress={() => {
            navigation.navigate('Search');
          }}
        >
          <Text style={styles.requestRentText}>
            Request to Rent
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* =========================================================
   RATING ROW
========================================================= */

function RatingRow({
  label,
  count,
  width,
}: {
  label: string;
  count: number;
  width: `${number}%`;
}) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>
        {label}
      </Text>

      <Text style={styles.ratingStar}>
        ★
      </Text>

      <View style={styles.ratingBarBackground}>
        <View
          style={[
            styles.ratingBar,
            {
              width: width,
            },
          ]}
        />
      </View>

      <Text style={styles.ratingCount}>
        {count}
      </Text>
    </View>
  );
}

/* =========================================================
   FEEDBACK CARD
========================================================= */

function FeedbackCard({
  name,
  rating,
  message,
}: {
  name: string;
  rating: number;
  message: string;
}) {
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackAvatar}>
        <Ionicons
          name="person"
          size={24}
          color={colors.textMuted}
        />
      </View>

      <View style={styles.feedbackContent}>
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackName}>
            {name}
          </Text>

          <View style={styles.feedbackStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                style={[
                  styles.feedbackStar,
                  star <= rating
                    ? styles.starActive
                    : styles.starInactive,
                ]}
              >
                ★
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.feedbackText}>
          {message}
        </Text>
      </View>
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
    backgroundColor: colors.white,
  },

  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.white,
  },

  scrollContent: {
    width: '100%',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    width: '100%',
    height: 84,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  /* =====================================================
     IMAGE
  ===================================================== */

  imageSection: {
    width: '100%',
    height: 365,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.white,
  },

  mainImage: {
    width: '100%',
    height: '100%',
  },

  backButton: {
    position: 'absolute',
    left: 38,
    top: 35,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageCount: {
    position: 'absolute',
    right: 38,
    top: 52,
    minWidth: 70,
    height: 34,
    paddingHorizontal: 15,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageCountText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  priceBadge: {
    position: 'absolute',
    left: 34,
    bottom: 28,
    height: 57,
    minWidth: 195,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priceText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },

  availableBadge: {
    position: 'absolute',
    right: 34,
    bottom: 28,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  availableDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.success,
    marginRight: 8,
  },

  availableText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
  },

  /* =====================================================
     TITLE
  ===================================================== */

  titleSection: {
    width: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: 38,
    paddingTop: 18,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  titleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
  },

  bookmarkButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  authorText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 7,
  },

  /* =====================================================
     MAIN CONTENT
  ===================================================== */

  contentSection: {
    width: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: 38,
    paddingTop: 15,
  },

  programBadge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  programText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },

  /* =====================================================
     DATE CARD
  ===================================================== */

  dateCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
    marginBottom: 22,
  },

  dateTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  dateRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },

  dateBox: {
    flex: 1,
    height: 78,
    backgroundColor: '#E8ECF2',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  dateLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 5,
  },

  addDate: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },

  /* =====================================================
     ABOUT
  ===================================================== */

  aboutSection: {
    width: '100%',
    marginBottom: 20,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },

  detailText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  /* =====================================================
     LENDER
  ===================================================== */

  lenderCard: {
    width: '100%',
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
  },

  lenderAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E5E8ED',
    borderWidth: 1,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  lenderInfo: {
    flex: 1,
  },

  lenderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  lenderName: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },

  lenderYear: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },

  ratingSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  starText: {
    color: '#EBA62F',
    fontSize: 15,
    marginRight: 5,
  },

  ratingText: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  /* =====================================================
     DIVIDER
  ===================================================== */

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  /* =====================================================
     REVIEWS
  ===================================================== */

  reviewCount: {
    color: colors.textSecondary,
  },

  ratingRow: {
    width: '100%',
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingLabel: {
    width: 55,
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '600',
  },

  ratingStar: {
    width: 30,
    color: '#EBA62F',
    fontSize: 21,
  },

  ratingBarBackground: {
    flex: 1,
    height: 5,
    backgroundColor: '#F2D7A8',
    borderRadius: 3,
    overflow: 'hidden',
  },

  ratingBar: {
    height: '100%',
    backgroundColor: '#EBA62F',
    borderRadius: 3,
  },

  ratingCount: {
    width: 30,
    textAlign: 'right',
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '600',
  },

  /* =====================================================
     FEEDBACK
  ===================================================== */

  feedbackCard: {
    width: '100%',
    minHeight: 84,
    borderWidth: 1,
    borderColor: '#9BA9C5',
    borderRadius: 8,
    backgroundColor: '#F7F8FB',
    flexDirection: 'row',
    padding: 10,
    marginBottom: 10,
  },

  feedbackAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E3E6EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  feedbackContent: {
    flex: 1,
  },

  feedbackHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  feedbackName: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },

  feedbackStars: {
    flexDirection: 'row',
  },

  feedbackStar: {
    fontSize: 17,
    marginLeft: 1,
  },

  starActive: {
    color: '#EBA62F',
  },

  starInactive: {
    color: '#C8CDD5',
  },

  feedbackText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  bottomSpace: {
    height: 30,
  },

  /* =====================================================
     BOTTOM BAR
  ===================================================== */

  bottomBar: {
    width: '100%',
    height: 96,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  chatButton: {
    width: 70,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatText: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 3,
  },

  requestRentButton: {
    flex: 1,
    height: 53,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  requestRentText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});