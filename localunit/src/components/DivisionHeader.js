import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function DivisionHeader({ division, category, onChangeDivision }) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          { backgroundColor: division ? `${division.accentColor}18` : '#e1f4f7' },
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: division?.accentColor || '#10aabd' },
          ]}
        />
        <Text
          style={[
            styles.badgeText,
            { color: division?.accentColor || '#126b81' },
          ]}
        >
          {division?.code || 'Select division'} · {category || 'Choose category'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onChangeDivision}
        style={styles.changeButton}
      >
        <Text style={styles.changeText}>Change Division</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },
  dot: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  changeText: {
    color: '#426587',
    fontSize: 11,
    fontWeight: '700',
  },
});
