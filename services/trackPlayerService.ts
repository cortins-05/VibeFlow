import TrackPlayer, {
  AndroidAudioContentType,
  AppKilledPlaybackBehavior,
  Capability,
  Event,
} from 'react-native-track-player';

export async function setupPlayer() {
  let isSetup = false;
  try {
    await TrackPlayer.getActiveTrack();
    isSetup = true;
  } catch {
    await TrackPlayer.setupPlayer({
      androidAudioContentType: AndroidAudioContentType.Music,
      autoHandleInterruptions: true,
    });
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        alwaysPauseOnInterruption: true,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      progressUpdateEventInterval: 1,
    });
    isSetup = true;
  }
  return isSetup;
}

export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious()
  );
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) =>
    TrackPlayer.seekTo(e.position)
  );

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused) {
      await TrackPlayer.pause();
    }
  });
};
