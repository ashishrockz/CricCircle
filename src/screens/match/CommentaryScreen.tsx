import React, {useEffect} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RoomStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useMatchStore} from '../../stores/match.store';
import {scale} from '../../utils/responsive';
import CommentaryItem from '../../components/CommentaryItem';
import EmptyState from '../../components/ui/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';

type Props = NativeStackScreenProps<RoomStackParams, 'Commentary'>;

export default function CommentaryScreen({route}: Props) {
  const {matchId} = route.params;
  const {colors} = useTheme();
  const {commentary, fetchCommentary} = useMatchStore();

  useEffect(() => {
    fetchCommentary(matchId);
  }, [matchId, fetchCommentary]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScreenHeader title="Commentary" />
      <FlatList
        data={[...commentary].reverse()}
        keyExtractor={(_, i) => String(i)}
        renderItem={({item}) => <CommentaryItem entry={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="message-circle" message="No commentary yet" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  list: {padding: scale(16)},
});
