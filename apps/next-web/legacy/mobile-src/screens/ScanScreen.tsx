import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { OCRReviewForm } from '../components/transactions/OCRReviewForm';
import { Button } from '../components/ui/Button';
import type { OCRExtractedFields, OCRScanInput } from '../services/OCRService';
import { OCRParsingError, OCRScanError } from '../services/OCRService';
import { isOpenAIOcrEnabled, ocrService } from '../services/ocrServiceInstance';
import { createTransactionService } from '../services/transactionServiceInstance';

type SelectedScanAsset = {
  uri: string;
  mimeType: string;
  source: OCRScanInput['source'];
};

const fallbackScanDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createManualReviewSeed = (): OCRExtractedFields => ({
  merchant: '',
  amountCents: 0,
  date: fallbackScanDate(),
  categoryId: 'Other',
  description: '',
  confidence: 0,
});

const normalizeForScan = async (asset: SelectedScanAsset): Promise<SelectedScanAsset> => {
  if (asset.mimeType === 'application/pdf') {
    return asset;
  }

  let manipulated: ImageManipulator.ImageResult;
  try {
    manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1024 } }],
      {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new OCRScanError(`Image compression failed: ${message}`);
  }

  return {
    ...asset,
    uri: manipulated.uri,
    mimeType: 'image/jpeg',
  };
};

const toUserFacingError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown OCR error';

  if (/No text detected/i.test(message)) {
    return 'No text detected. Retake with stronger lighting and sharper focus.';
  }
  if (/PDF OCR fallback is unavailable/i.test(message)) {
    return 'PDF scanning needs OpenAI key. Use camera or gallery image scan instead.';
  }
  if (/Offline OCR cannot read PDF yet/i.test(message)) {
    return 'Offline OCR currently supports image receipts only. Use camera/gallery image.';
  }
  if (/Offline OCR requires development build/i.test(message)) {
    return 'Offline OCR requires development build (not Expo Go). Build and install dev client first.';
  }
  if (/OpenAI OCR request failed/i.test(message)) {
    const statusMatch = message.match(/OpenAI OCR request failed \((\d+)\)/i);
    const status = statusMatch?.[1];
    if (status === '401') {
      return 'OpenAI rejected key (401). Check EXPO_PUBLIC_OPENAI_API_KEY value.';
    }
    if (status === '429') {
      return 'OpenAI rate limit or billing issue (429). Check account usage and retry.';
    }
    return `OpenAI OCR failed${status ? ` (${status})` : ''}. Check key, model access, and billing.`;
  }
  if (/timed out|timeout/i.test(message)) {
    return 'OpenAI request timed out. Check network and retry.';
  }
  if (/network|fetch failed|failed to fetch/i.test(message)) {
    return 'Network issue during OCR. Check internet and retry.';
  }
  if (error instanceof OCRParsingError) {
    return 'OCR output malformed. Please review manually or retake image.';
  }
  if (error instanceof OCRScanError) {
    return message;
  }

  return 'Scan failed. Try again or add transaction manually.';
};

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewData, setReviewData] = useState<OCRExtractedFields | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SelectedScanAsset | null>(null);
  const transactionService = createTransactionService();

  const processScan = async (rawAsset: SelectedScanAsset) => {
    setIsProcessing(true);
    setReviewData(null);

    try {
      const asset = await normalizeForScan(rawAsset);
      console.log('[ScanScreen] selected asset', {
        source: asset.source,
        mimeType: asset.mimeType,
        uriPrefix: asset.uri.slice(0, 80),
      });
      setSelectedAsset(asset);
      const result = await ocrService.scan({
        imageUri: asset.uri,
        mimeType: asset.mimeType,
        source: asset.source,
      });
      setReviewData(result.fields);

      if (result.lowConfidence) {
        Alert.alert('Low confidence OCR', 'Please review all fields before saving.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/Offline OCR requires development build/i.test(message)) {
        setReviewData(createManualReviewSeed());
        Alert.alert('Manual review mode', 'Install development build for offline OCR. For now, enter values manually.');
        return;
      }
      Alert.alert('Scan failed', toUserFacingError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) {
      return;
    }
    if (!isCameraReady) {
      Alert.alert('Camera not ready', 'Wait one second, then try capture again.');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      if (!photo?.uri) {
        throw new OCRScanError('Camera returned empty image');
      }
      await processScan({
        uri: photo.uri,
        mimeType: 'image/jpeg',
        source: 'camera',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/Failed to capture image/i.test(message)) {
        try {
          const fallback = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: false,
            mediaTypes: ['images'],
          });
          if (!fallback.canceled && fallback.assets[0]?.uri) {
            await processScan({
              uri: fallback.assets[0].uri,
              mimeType: fallback.assets[0].mimeType ?? 'image/jpeg',
              source: 'camera',
            });
            return;
          }
        } catch {
          // keep original friendly message below
        }
        Alert.alert('Capture failed', 'Camera capture failed on device. Try system camera permission check or gallery import.');
        return;
      }
      Alert.alert('Capture failed', toUserFacingError(error));
    }
  };

  const handleGalleryImport = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled) {
        return;
      }

      const image = result.assets[0];
      if (!image?.uri) {
        Alert.alert('Import failed', 'Selected image is missing file path.');
        return;
      }
      await processScan({
        uri: image.uri,
        mimeType: image.mimeType ?? 'image/jpeg',
        source: 'gallery',
      });
    } catch (error) {
      console.error('Gallery import failed', error);
      Alert.alert('Import failed', 'Could not import image from gallery. Please try again.');
    }
  };

  const handlePdfImport = async () => {
    if (!isOpenAIOcrEnabled) {
      Alert.alert('PDF unavailable', 'PDF scan needs AI key. Use camera or gallery image instead.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file?.uri) {
        Alert.alert('Import failed', 'Selected PDF is missing file path.');
        return;
      }
      await processScan({
        uri: file.uri,
        mimeType: file.mimeType ?? 'application/pdf',
        source: 'pdf',
      });
    } catch (error) {
      console.error('PDF import failed', error);
      Alert.alert('Import failed', 'Could not import PDF. Please try again.');
      return;
    }
  };

  const handleSaveReviewedData = async (value: OCRExtractedFields) => {
    try {
      await transactionService.create({
        amountCents: value.amountCents,
        type: 'expense',
        categoryId: value.categoryId || 'Other',
        merchant: value.merchant || undefined,
        description: value.description || undefined,
        date: value.date || fallbackScanDate(),
        receiptPath: selectedAsset?.uri,
        ocrConfidence: value.confidence,
      });
      Alert.alert('Saved', 'Transaction created from scanned receipt.');
      setReviewData(null);
      setSelectedAsset(null);
    } catch (error) {
      console.error('Save reviewed data failed', error);
      const message = error instanceof Error ? error.message : 'Failed to save transaction from scan.';
      Alert.alert('Error', message);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base text-neutral-700">Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
        <Text className="text-center text-base text-neutral-700">
          Camera permission needed for receipt capture. You can still import from gallery or PDF.
        </Text>
        <View className="w-full">
          <Button label="Allow Camera" onPress={() => void requestPermission()} />
        </View>
        <View className="w-full">
          <Button label="Import from Gallery" variant="secondary" onPress={() => void handleGalleryImport()} />
        </View>
        {isOpenAIOcrEnabled ? (
          <View className="w-full">
            <Button label="Import PDF" variant="secondary" onPress={() => void handlePdfImport()} />
          </View>
        ) : null}
      </View>
    );
  }

  if (reviewData) {
    return (
      <ScrollView className="flex-1 bg-white p-4">
        <Text className="mb-4 text-3xl font-bold tracking-tight text-black">Review OCR</Text>
        <OCRReviewForm initialValues={reviewData} onCancel={() => setReviewData(null)} onSubmit={handleSaveReviewedData} />
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        onCameraReady={() => setIsCameraReady(true)}
        onMountError={(event) => {
          const message = event.message ?? 'Unknown camera error';
          setIsCameraReady(false);
          Alert.alert('Camera unavailable', message);
        }}
      >
        <View className="flex-1 items-center justify-center">
          <View className="h-80 w-64 rounded-2xl border-2 border-white/80" />
        </View>
      </CameraView>

      <View className="gap-3 bg-white px-4 pb-8 pt-4">
        {isProcessing ? (
          <View className="items-center gap-3 py-4">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="text-sm font-semibold text-neutral-700">Running OCR...</Text>
          </View>
        ) : (
          <>
            <Button
              label={isCameraReady ? 'Capture Receipt' : 'Preparing camera...'}
              onPress={() => void handleCapture()}
              disabled={!isCameraReady}
            />
            <Button label="Import from Gallery" variant="secondary" onPress={() => void handleGalleryImport()} />
            {isOpenAIOcrEnabled ? <Button label="Import PDF" variant="secondary" onPress={() => void handlePdfImport()} /> : null}
          </>
        )}
      </View>
    </View>
  );
}
