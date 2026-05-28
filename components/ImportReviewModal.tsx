import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { AlertTriangle, FileWarning, WifiOff } from 'lucide-react-native';
import { useTheme } from '../constants/theme';
import { useLibraryStore } from '../stores/libraryStore';
import {
  searchAndMatch,
  matchedTracksToTracks,
  readAndParseFile,
  type MatchedTrack,
  type ParsedTrack,
  type FileError,
} from '../services/playlistImporter';

type ImportPhase =
  | { key: 'reading' }
  | { key: 'searching'; done: number; total: number }
  | { key: 'review'; matched: MatchedTrack[]; name: string }
  | { key: 'saving'; count: number }
  | { key: 'done' }
  | { key: 'error'; title: string; message: string; recoverable: boolean };

interface Props {
  visible: boolean;
  fileUri: string;
  defaultName: string;
  onClose: () => void;
}

export default function ImportReviewModal({ visible, fileUri, defaultName, onClose }: Props) {
  const { colors, fonts } = useTheme();
  const { createPlaylist, addTrackToPlaylist } = useLibraryStore();

  const [phase, setPhase] = useState<ImportPhase>({ key: 'reading' });
  const [name, setName] = useState(defaultName);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());

  const abortRef = useRef<AbortController | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const reset = useCallback(() => {
    setPhase({ key: 'reading' });
    setName(defaultName);
    setConfirmed(new Set());
    progressAnim.setValue(0);
  }, [defaultName]);

  useEffect(() => {
    if (!visible) {
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    reset();

    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    (async () => {
      // Step 1: Read + parse
      let tracks: ParsedTrack[];
      try {
        const result = await readAndParseFile(fileUri);
        tracks = result.tracks;
        setName(result.name);
      } catch (e: any) {
        if (cancelled || e?.name === 'AbortError') return;
        if (e?.name === 'FileError') {
          const fe = e as FileError;
          const msg: Record<string, string> = {
            read_error: 'No se pudo leer el archivo. Asegúrate de que exista y sea accesible.',
            parse_error: 'El formato del archivo no es reconocido. Usa CSV, JSON o TXT con columnas Title/Artist.',
            no_tracks: 'No se encontraron canciones en el archivo. Verifica el formato.',
            unsupported_format: 'Tipo de archivo no soportado.',
          };
          setPhase({ key: 'error', title: 'Error de archivo', message: msg[fe.kind] || fe.message, recoverable: true });
        } else {
          setPhase({ key: 'error', title: 'Error inesperado', message: 'Ocurrió un error al leer el archivo.', recoverable: true });
        }
        return;
      }

      if (cancelled || controller.signal.aborted) return;

      // Step 2: Search YouTube
      setPhase({ key: 'searching', done: 0, total: tracks.length });

      let matched: MatchedTrack[];
      try {
        matched = await searchAndMatch(
          tracks,
          controller.signal,
          (done, total) => {
            setPhase({ key: 'searching', done, total });
            Animated.timing(progressAnim, {
              toValue: done / total,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
        );
      } catch (e: any) {
        if (cancelled || e?.name === 'AbortError') return;
        setPhase({
          key: 'error',
          title: 'Error de búsqueda',
          message: 'No se pudieron buscar las canciones en YouTube. Revisa tu conexión a internet e intenta de nuevo.',
          recoverable: true,
        });
        return;
      }

      if (cancelled || controller.signal.aborted) return;

      // Auto-confirm matches >= 70%
      const initial = new Set<number>();
      matched.forEach((m, i) => {
        if (m.confidence >= 70) initial.add(i);
      });
      setConfirmed(initial);
      setPhase({ key: 'review', matched, name });
    })();

    return () => {
      cancelled = true;
      controller.abort();
      abortRef.current = null;
    };
  }, [visible, fileUri]);

  function handleClose() {
    abortRef.current?.abort();
    abortRef.current = null;
    onClose();
  }

  function handleRetry() {
    reset();
    // Re-trigger by toggling visible
    abortRef.current?.abort();
    abortRef.current = null;
    onClose();
    // Parent re-opens via state
  }

  function toggleIndex(idx: number) {
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function handleImport() {
    if (phase.key !== 'review') return;
    if (!name.trim() || confirmed.size === 0) return;

    setPhase({ key: 'saving', count: confirmed.size });

    const confirmedMatches = phase.matched.filter((_, i) => confirmed.has(i));
    const tracks = matchedTracksToTracks(confirmedMatches);

    try {
      createPlaylist(name.trim());
      const pl = useLibraryStore.getState().playlists;
      if (pl[0]) {
        for (const track of tracks) {
          addTrackToPlaylist(pl[0].id, track);
        }
      }
      setPhase({ key: 'done' });
      setTimeout(() => onClose(), 800);
    } catch {
      setPhase({
        key: 'error',
        title: 'Error al guardar',
        message: 'No se pudo crear la playlist. Intenta de nuevo.',
        recoverable: false,
      });
    }
  }

  function renderProgressBar(progress: number) {
    return (
      <View style={{ height: 2, backgroundColor: colors.border, borderRadius: 1, overflow: 'hidden', marginVertical: 12 }}>
        <Animated.View
          style={{
            height: '100%',
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: colors.accent,
            borderRadius: 1,
          }}
        />
      </View>
    );
  }

  const isBlocking = phase.key === 'reading' || phase.key === 'searching' || phase.key === 'saving';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11,12,11,0.8)' }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            paddingTop: 28,
            paddingBottom: 48,
            borderWidth: 1,
            borderColor: colors.border,
            borderBottomWidth: 0,
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.accent, letterSpacing: 1 }}>
              [ import playlist ]
            </Text>
            {!isBlocking && (
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textDim }}>
                  [ close ]
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* === READING === */}
          {phase.key === 'reading' && (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, marginTop: 16 }}>
                leyendo archivo...
              </Text>
            </View>
          )}

          {/* === SEARCHING === */}
          {phase.key === 'searching' && (
            <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color={colors.accent} size="small" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
                    buscando en YouTube...
                  </Text>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textFaint, marginTop: 4 }}>
                    {phase.done}/{phase.total} canciones procesadas
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.accent }}>
                  {Math.round((phase.done / phase.total) * 100)}%
                </Text>
              </View>
              {renderProgressBar(phase.done / phase.total)}

              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                style={{
                  alignSelf: 'center',
                  marginTop: 16,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>
                  [ cancelar importación ]
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* === REVIEW === */}
          {phase.key === 'review' && (() => {
            const { matched } = phase;
            const total = matched.length;
            const matchedCount = matched.filter((m) => m.confidence >= 70).length;
            const lowConfCount = matched.filter((m) => m.match && m.confidence < 70).length;
            const notFoundCount = matched.filter((m) => !m.match).length;

            return (
              <>
                {/* Playlist name */}
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.bg,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: colors.borderAccent,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.accent, marginRight: 8 }}>{'>'}</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="nombre de la playlist"
                      placeholderTextColor={colors.textFaint}
                      style={{
                        flex: 1,
                        fontFamily: fonts.mono,
                        fontSize: 13,
                        color: colors.text,
                        paddingVertical: 11,
                      }}
                    />
                  </View>
                </View>

                {/* Summary */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 16 }}>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.accent }}>
                    ✓ {matchedCount}
                  </Text>
                  {lowConfCount > 0 && (
                    <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.secondary }}>
                      ? {lowConfCount}
                    </Text>
                  )}
                  {notFoundCount > 0 && (
                    <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.error }}>
                      ✗ {notFoundCount}
                    </Text>
                  )}
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textFaint, marginLeft: 'auto' }}>
                    {confirmed.size} de {total}
                  </Text>
                </View>

                {/* Track list */}
                <ScrollView style={{ paddingHorizontal: 20, maxHeight: 320 }}>
                  {matched.map((m, i) => {
                    const isConfirmed = confirmed.has(i);
                    const isHighConf = m.confidence >= 70;

                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => toggleIndex(i)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          opacity: isConfirmed ? 1 : 0.4,
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: isConfirmed ? colors.accent : colors.textFaint,
                            backgroundColor: isConfirmed ? colors.accent : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          {isConfirmed && <Text style={{ fontSize: 12, color: colors.bg, fontWeight: 'bold' }}>✓</Text>}
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.text }}
                            numberOfLines={1}
                          >
                            {m.original.artist} - {m.original.title}
                          </Text>
                          {m.match ? (
                            <Text
                              style={{ fontFamily: fonts.mono, fontSize: 9, color: isHighConf ? colors.textDim : colors.secondary, marginTop: 2 }}
                              numberOfLines={1}
                            >
                              → {m.match.title} · {m.match.artist}
                              {!isHighConf && ` (${m.confidence}%)`}
                            </Text>
                          ) : (
                            <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.error, marginTop: 2 }}>
                              → no encontrado
                            </Text>
                          )}
                        </View>

                        {m.match && (
                          <Text
                            style={{
                              fontFamily: fonts.mono,
                              fontSize: 9,
                              color: isHighConf ? colors.accent : colors.secondary,
                              marginLeft: 8,
                            }}
                          >
                            {m.confidence}%
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Import button */}
                <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={handleImport}
                    disabled={confirmed.size === 0 || !name.trim()}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 4,
                      backgroundColor: confirmed.size > 0 ? colors.accent : colors.textFaint,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1, color: colors.bg }}>
                      importar {confirmed.size} track{confirmed.size !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          {/* === SAVING === */}
          {phase.key === 'saving' && (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, marginTop: 16 }}>
                guardando {phase.count} tracks...
              </Text>
            </View>
          )}

          {/* === DONE === */}
          {phase.key === 'done' && (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 24, color: colors.accent }}>✓</Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, marginTop: 12 }}>
                playlist importada
              </Text>
            </View>
          )}

          {/* === ERROR === */}
          {phase.key === 'error' && (
            <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,77,77,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <AlertTriangle color={colors.error} size={22} />
              </View>
              <Text style={{ fontFamily: fonts.sans, fontSize: 18, color: colors.text, textAlign: 'center' }}>
                {phase.title}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
                {phase.message}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 24, gap: 12 }}>
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
                    cerrar
                  </Text>
                </TouchableOpacity>
                {phase.recoverable && (
                  <TouchableOpacity
                    onPress={handleRetry}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 4,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.bg }}>
                      reintentar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
