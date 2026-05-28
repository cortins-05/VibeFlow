import { View } from 'react-native';
import ConsoleButton from '../ui/ConsoleButton';
import DownloadButton from '../DownloadButton';
import type { DownloadState } from '../../hooks/useTrackDownload';

export default function SecondaryActions(p: {
  fav: boolean;
  onToggleFav: () => void;
  hasLyrics: boolean;
  showLyrics: boolean;
  onToggleLyrics: () => void;
  downloadProps: {
    state: DownloadState;
    progress: number | null;
    onDownload: () => void;
    onPause: () => void;
    onResume: () => void;
    onDismiss: () => void;
  };
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 }}>
      <ConsoleButton label={p.fav ? 'saved' : 'save'} variant={p.fav ? 'secondary' : 'ghost'} filled={p.fav} onPress={p.onToggleFav} />
      {p.hasLyrics ? (
        <ConsoleButton label="lyrics" variant="accent" filled={p.showLyrics} onPress={p.onToggleLyrics} />
      ) : null}
      <DownloadButton {...p.downloadProps} />
    </View>
  );
}
