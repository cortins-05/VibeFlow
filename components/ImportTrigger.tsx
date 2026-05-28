import { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Upload } from 'lucide-react-native';
import { useTheme, glow } from '../constants/theme';
import ImportReviewModal from './ImportReviewModal';

interface Props {
  compact?: boolean;
}

export default function ImportTrigger({ compact }: Props) {
  const { colors, fonts } = useTheme();
  const [importUri, setImportUri] = useState('');
  const [importName, setImportName] = useState('');
  const [showImport, setShowImport] = useState(false);

  async function handlePress() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const pickedUri = result.assets[0].uri;
      const name = pickedUri.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Imported Playlist';

      // Copy immediately to bypass Android temporary URI permission expiry
      const destDir = FileSystem.cacheDirectory + 'import/';
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const destUri = destDir + Date.now() + '_' + (name || 'import');
      await FileSystem.copyAsync({ from: pickedUri, to: destUri });

      setImportUri(destUri);
      setImportName(name);
      setShowImport(true);
    } catch {
      // silent fail
    }
  }

  return (
    <>
      {compact ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Upload color={colors.textDim} size={14} strokeWidth={2} />
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginLeft: 6 }}>
            import
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Upload color={colors.accent} size={18} strokeWidth={2} />
          <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 20, color: colors.text, marginLeft: 12 }}>
            Import Playlist
          </Text>
        </TouchableOpacity>
      )}

      <ImportReviewModal
        visible={showImport}
        fileUri={importUri}
        defaultName={importName}
        onClose={() => setShowImport(false)}
      />
    </>
  );
}
