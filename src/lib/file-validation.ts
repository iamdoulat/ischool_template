import api from "@/lib/api";

export interface FileUploadSetting {
  file_extension: string;
  file_mime: string;
  file_size: number;
  image_extension: string;
  image_mime: string;
  image_size: number;
}

let cachedSettings: FileUploadSetting | null = null;
let fetchPromise: Promise<FileUploadSetting | null> | null = null;

const BLACKLISTED_EXTENSIONS = [
  'php', 'php3', 'php4', 'php5', 'phtml', 'phar',
  'html', 'htm', 'shtml', 'js', 'jsp', 'asp', 'aspx', 'cgi', 'pl', 'py', 'sh', 'bat', 'cmd',
  'exe', 'com', 'dll', 'vbs', 'vbe', 'jse', 'jar', 'htaccess', 'htpasswd', 'env', 'config'
];

/**
 * Fetch and cache system file upload security settings.
 */
export async function getFileUploadSettings(): Promise<FileUploadSetting | null> {
  if (cachedSettings) return cachedSettings;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await api.get('/system-setting/file-types', { skipGlobalErrorHandler: true });
      if (response.data?.success && response.data?.data) {
        cachedSettings = response.data.data;
        return cachedSettings;
      }
    } catch (e) {
      console.warn("Failed to fetch file upload settings for client validation", e);
    } finally {
      fetchPromise = null;
    }
    return null;
  })();

  return fetchPromise;
}

/**
 * Clear cached file settings (useful when settings page updates).
 */
export function clearFileUploadSettingsCache() {
  cachedSettings = null;
}

/**
 * Validate a file against system security criteria before upload.
 */
export async function validateFileBeforeUpload(
  file: File,
  isImage: boolean = false
): Promise<{ valid: boolean; error?: string }> {
  const fileName = file.name || "";
  const extension = fileName.split('.').pop()?.toLowerCase() || "";
  const mimeType = (file.type || "").toLowerCase();
  const size = file.size;

  // 1. Blacklist Check
  if (BLACKLISTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Security violation: Executable/script files (.${extension}) are not allowed.`
    };
  }

  // 2. Load Settings
  const settings = await getFileUploadSettings();
  if (!settings) {
    return { valid: true };
  }

  const isImageCategory = isImage || mimeType.startsWith('image/');

  const allowedExtStr = isImageCategory && settings.image_extension
    ? settings.image_extension
    : settings.file_extension;

  const allowedMimeStr = isImageCategory && settings.image_mime
    ? settings.image_mime
    : settings.file_mime;

  const maxSize = isImageCategory && Number(settings.image_size) > 0
    ? Number(settings.image_size)
    : Number(settings.file_size || 0);

  // 3. Extension check
  if (allowedExtStr && allowedExtStr.trim()) {
    const allowedExts = allowedExtStr
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e && !BLACKLISTED_EXTENSIONS.includes(e));

    if (allowedExts.length > 0 && !allowedExts.includes(extension)) {
      return {
        valid: false,
        error: `File extension '.${extension}' is not allowed. Allowed: ${allowedExts.join(', ')}`
      };
    }
  }

  // 4. MIME type check
  if (allowedMimeStr && allowedMimeStr.trim()) {
    const allowedMimes = allowedMimeStr
      .split(',')
      .map(m => m.trim().toLowerCase())
      .filter(Boolean);

    let mimeAllowed = false;
    for (const allowedMime of allowedMimes) {
      if (allowedMime === mimeType) {
        mimeAllowed = true;
        break;
      }
      if (allowedMime.endsWith('/*')) {
        const prefix = allowedMime.split('/')[0];
        if (mimeType.startsWith(`${prefix}/`)) {
          mimeAllowed = true;
          break;
        }
      }
    }

    if (allowedMimes.length > 0 && !mimeAllowed) {
      return {
        valid: false,
        error: `File MIME type '${mimeType || "unknown"}' is not allowed.`
      };
    }
  }

  // 5. Size check
  if (maxSize > 0 && size > maxSize) {
    const maxMb = (maxSize / (1024 * 1024)).toFixed(2);
    const actualMb = (size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${actualMb} MB) exceeds maximum allowed size of ${maxMb} MB.`
    };
  }

  return { valid: true };
}
