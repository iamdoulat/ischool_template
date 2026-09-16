/**
 * Mobile-resilient Camera & Video Stream Utility
 * 
 * Handles front ('user') and rear ('environment') camera switching on mobile browsers
 * (iOS Safari, Android Chrome) with hardware release cooldowns, multi-tier constraint
 * fallbacks, and proper video element attribute bindings.
 */

export interface AcquireCameraOptions {
  targetFacing?: 'user' | 'environment';
  deviceId?: string;
  currentStream?: MediaStream | null;
  videoElement?: HTMLVideoElement | null;
  idealWidth?: number;
  idealHeight?: number;
  cooldownMs?: number;
}

/**
 * Safely stops all tracks in a MediaStream and detaches it from an optional video element.
 */
export function stopCameraStream(
  stream?: MediaStream | null,
  videoElement?: HTMLVideoElement | null
): void {
  try {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
    }
    if (videoElement) {
      videoElement.pause?.();
      videoElement.srcObject = null;
    }
  } catch {
    // silent catch
  }
}

/**
 * Attaches a MediaStream to an HTMLVideoElement with mobile-required attributes (playsInline, muted)
 * and safely triggers video.play() once metadata is loaded.
 */
export async function attachStreamToVideo(
  video: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;
  video.defaultMuted = true;
  video.srcObject = stream;

  return new Promise<void>((resolve) => {
    const handleReady = () => {
      video.removeEventListener('loadedmetadata', handleReady);
      video.play().catch(() => {
        // play request might be interrupted by user or browser policy
      }).finally(() => resolve());
    };

    if (video.readyState >= 1) {
      video.play().catch(() => {}).finally(() => resolve());
    } else {
      video.addEventListener('loadedmetadata', handleReady, { once: true });
      // Fallback timeout in case loadedmetadata doesn't fire immediately
      setTimeout(() => {
        video.removeEventListener('loadedmetadata', handleReady);
        video.play().catch(() => {}).finally(() => resolve());
      }, 500);
    }
  });
}

/**
 * Acquires a camera MediaStream with comprehensive mobile fallbacks:
 * 1. Releases previous stream with a 200ms cooldown so OS camera drivers release hardware locks.
 * 2. Tries targeted facingMode with ideal resolution.
 * 3. Tries targeted facingMode without resolution restrictions (vital for mobile portrait mode).
 * 4. Tries deviceId match via device enumeration.
 * 5. General fallback to any available video.
 */
export async function acquireCameraStream(
  options: AcquireCameraOptions = {}
): Promise<MediaStream> {
  const {
    targetFacing = 'environment',
    deviceId,
    currentStream,
    videoElement,
    idealWidth = 1280,
    idealHeight = 720,
    cooldownMs = 200,
  } = options;

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('MediaDevices API not supported on this browser or environment.');
  }

  // Step 1: Teardown existing stream and enforce cooldown so mobile OS releases the camera sensor
  if (currentStream || (videoElement && videoElement.srcObject)) {
    stopCameraStream(currentStream || (videoElement?.srcObject as MediaStream), videoElement);
    if (cooldownMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, cooldownMs));
    }
  }

  const tryConstraints = async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      return null;
    }
  };

  let stream: MediaStream | null = null;

  // Case A: Specific deviceId requested
  if (deviceId) {
    stream = await tryConstraints({ video: { deviceId: { exact: deviceId } } });
    if (!stream) {
      stream = await tryConstraints({ video: { deviceId: { ideal: deviceId } } });
    }
  }

  // Case B: Facing Mode (rear 'environment' or front 'user')
  if (!stream) {
    // Attempt 1: Target facing mode with ideal resolution
    stream = await tryConstraints({
      video: {
        facingMode: { ideal: targetFacing },
        width: { ideal: idealWidth },
        height: { ideal: idealHeight },
      },
    });

    // Attempt 2: Target facing mode with exact or plain facingMode without resolution constraints
    if (!stream) {
      stream = await tryConstraints({
        video: { facingMode: targetFacing },
      });
    }

    if (!stream) {
      stream = await tryConstraints({
        video: { facingMode: { ideal: targetFacing } },
      });
    }

    // Attempt 3: Inspect enumerated devices and find matching camera by label
    if (!stream && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const searchTerms =
          targetFacing === 'environment'
            ? ['back', 'rear', 'environment', '0', 'main', 'external']
            : ['front', 'user', 'selfie', '1', 'internal', 'face'];

        const matched = videoInputs.find((d) => {
          const label = (d.label || '').toLowerCase();
          return searchTerms.some((term) => label.includes(term));
        });

        if (matched?.deviceId) {
          stream = await tryConstraints({
            video: { deviceId: { exact: matched.deviceId } },
          });
        }
      } catch {
        // ignore enumeration errors
      }
    }

    // Attempt 4: Fallback to any video input
    if (!stream) {
      stream = await tryConstraints({ video: true });
    }
  }

  if (!stream) {
    throw new Error('Could not access requested camera source.');
  }

  // Step 2: Bind to video element if provided
  if (videoElement) {
    await attachStreamToVideo(videoElement, stream);
  }

  return stream;
}
