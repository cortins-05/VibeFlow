import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { getDownloadUrl } from '../services/youtube';
import { useDownloadStore } from '../stores/downloadStore';
import type { Track } from '../stores/playerStore';

export type DownloadState = 'idle' | 'downloading' | 'pausing' | 'paused' | 'done' | 'error';

export function useTrackDownload(currentTrack: Track | null) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>(
    currentTrack && useDownloadStore.getState().isDownloaded(currentTrack.videoId) ? 'done' : 'idle'
  );
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);
  const downloadResumeDataRef = useRef<string | undefined>(undefined);
  const downloadUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    setDownloadState(
      currentTrack && useDownloadStore.getState().isDownloaded(currentTrack.videoId) ? 'done' : 'idle'
    );
    setDownloadProgress(null);
    downloadResumableRef.current = null;
    downloadResumeDataRef.current = undefined;
    downloadUrlRef.current = undefined;
  }, [currentTrack?.videoId]);

  async function handleDownload() {
    if (!currentTrack) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDownloadState('downloading');
    setDownloadProgress(0);

    try {
      const src = await getDownloadUrl(currentTrack.videoId);
      if (!src?.url) {
        setDownloadState('error');
        return;
      }

      downloadUrlRef.current = src.url;

      const dir = `${FileSystem.documentDirectory}audio/`;
      const safeName = currentTrack.title.replace(/[/\\?%*:|"<>]/g, '_');
      // Use extension from content-type or default to .m4a
      const ext = src.url.includes('.webm') ? '.webm' : '.m4a';
      const destFile = dir + safeName + ext;

      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const callback: FileSystem.DownloadProgressCallback = (data) => {
        if (data.totalBytesExpectedToWrite > 0) {
          setDownloadProgress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
        }
      };

      const resumable = FileSystem.createDownloadResumable(
        src.url,
        destFile,
        src.headers,
        callback,
        downloadResumeDataRef.current,
      );
      downloadResumableRef.current = resumable;

      const result = await resumable.downloadAsync();

      if (result?.uri) {
        downloadResumableRef.current = null;
        downloadResumeDataRef.current = undefined;
        setDownloadState('done');
        setDownloadProgress(1);
        if (currentTrack) {
          useDownloadStore.getState().registerDownload(currentTrack, result.uri);
        }
      } else {
        setDownloadState('error');
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      // Pause is intentional — don't show as error
      if (errMsg?.includes('cancelled') || errMsg?.includes('pause')) {
        return;
      }
      console.error('[player] download failed:', errMsg);
      setDownloadState('error');
    }
  }

  async function handlePauseDownload() {
    const r = downloadResumableRef.current;
    if (!r) return;
    setDownloadState('pausing');
    try {
      const pauseState = await r.pauseAsync();
      downloadResumeDataRef.current = pauseState.resumeData;
      downloadResumableRef.current = null;
      setDownloadState('paused');
    } catch {
      setDownloadState('error');
    }
  }

  async function handleResumeDownload() {
    if (!currentTrack || !downloadResumeDataRef.current) return;
    setDownloadState('downloading');

    try {
      const dir = `${FileSystem.documentDirectory}audio/`;
      const safeName = currentTrack.title.replace(/[/\\?%*:|"<>]/g, '_');
      const ext = downloadUrlRef.current?.includes('.webm') ? '.webm' : '.m4a';
      const destFile = dir + safeName + ext;

      const callback: FileSystem.DownloadProgressCallback = (data) => {
        if (data.totalBytesExpectedToWrite > 0) {
          setDownloadProgress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
        }
      };

      const resumable = FileSystem.createDownloadResumable(
        downloadUrlRef.current!,
        destFile,
        undefined,
        callback,
        downloadResumeDataRef.current,
      );
      downloadResumableRef.current = resumable;
      downloadResumeDataRef.current = undefined;

      const result = await resumable.downloadAsync();

      if (result?.uri) {
        downloadResumableRef.current = null;
        setDownloadState('done');
        setDownloadProgress(1);
        if (currentTrack) {
          useDownloadStore.getState().registerDownload(currentTrack, result.uri);
        }
      } else {
        setDownloadState('error');
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      if (errMsg?.includes('cancelled') || errMsg?.includes('pause')) {
        return;
      }
      console.error('[player] download resume failed:', errMsg);
      setDownloadState('error');
    }
  }

  return {
    downloadState,
    downloadProgress,
    setDownloadState,
    handleDownload,
    handlePauseDownload,
    handleResumeDownload,
  };
}
