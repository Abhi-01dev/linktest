// Client-Side Face Presence & Webcam Proctoring Hook
// LinkTest Secure Examination System
// Fully local frame processing — zero video upload to servers

import { useState, useEffect, useRef, useCallback } from 'react';

const DEBUG_PROCTOR = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  Boolean(window.DEBUG_PROCTOR)
);

export function useWebcamProctor({
  enabled = true,
  faceDetectionEnabled = true,
  onViolation = null,
  onEvent = null,
  absenceThresholdSeconds = 5,
  multiFaceThresholdSeconds = 3
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const deviceChangeListenerRef = useRef(null);
  const isCancelledRef = useRef(false);

  const [hasPermission, setHasPermission] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [detectionState, setDetectionState] = useState('CHECKING'); // 'ONE_FACE', 'NO_FACE', 'MULTIPLE_FACES', 'UNCERTAIN', 'ERROR'
  const [faceCount, setFaceCount] = useState(1);
  const [warningMessage, setWarningMessage] = useState(null);

  // State machine timers & single-warning locks
  const absenceSecondsRef = useRef(0);
  const multiFaceSecondsRef = useRef(0);
  const faceAbsentWarnedRef = useRef(false);
  const multiFaceWarnedRef = useRef(false);
  const nativeDetectorRef = useRef(null);

  // Unified violation dispatcher supporting both onViolation(type, meta) and onEvent(type, meta)
  const notifyViolation = useCallback((eventType, metadata = {}) => {
    if (onViolation) {
      onViolation(eventType, metadata);
    } else if (onEvent) {
      if (typeof onEvent === 'function') {
        onEvent(eventType, metadata);
      }
    }
  }, [onViolation, onEvent]);

  // Check if browser has native FaceDetector API (experimental Chrome flag)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        // @ts-ignore
        nativeDetectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
      } catch (e) {
        nativeDetectorRef.current = null;
      }
    }
  }, []);

  /**
   * Fast Canvas-based Face Cluster & Chrominance Analyzer
   * Runs locally in 3-6ms without any external downloads or bundle bloat
   */
  const analyzeCanvasFrame = useCallback((videoElement) => {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.readyState < 2) {
      return { faceCount: 1, state: 'UNCERTAIN' };
    }

    const width = 160;
    const height = Math.floor((videoElement.videoHeight / videoElement.videoWidth) * width) || 120;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { faceCount: 1, state: 'UNCERTAIN' };

    ctx.drawImage(videoElement, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Overall frame brightness & black frame check
    let sumLuminance = 0;
    const totalPixels = width * height;
    for (let i = 0; i < data.length; i += 8) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sumLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
    }
    const meanLuminance = sumLuminance / (totalPixels / 2);
    if (meanLuminance < 10) {
      return { faceCount: 0, state: 'NO_FACE', reason: 'dark_or_covered' };
    }

    // 2. Spatial grid (16 cols x 12 rows) analysis for skin chrominance & facial contrast
    const cols = 16;
    const rows = 12;
    const cellW = Math.floor(width / cols);
    const cellH = Math.floor(height / rows);
    const grid = Array.from({ length: rows }, () => new Uint8Array(cols));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let skinCount = 0;
        let minLum = 255;
        let maxLum = 0;
        let sampled = 0;

        for (let y = r * cellH; y < (r + 1) * cellH; y += 2) {
          for (let x = c * cellW; x < (c + 1) * cellW; x += 2) {
            const idx = (y * width + x) * 4;
            const red = data[idx];
            const green = data[idx + 1];
            const blue = data[idx + 2];

            const lum = 0.299 * red + 0.587 * green + 0.114 * blue;
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;

            // YCbCr skin tone detection model
            const cb = -0.168736 * red - 0.331264 * green + 0.5 * blue + 128;
            const cr = 0.5 * red - 0.418688 * green - 0.081312 * blue + 128;

            const isSkin = cb >= 75 && cb <= 135 && cr >= 130 && cr <= 180 &&
                           red > 40 && green > 25 && blue > 15 &&
                           red > green && red > blue &&
                           Math.abs(red - green) > 8;

            if (isSkin) skinCount++;
            sampled++;
          }
        }

        const skinRatio = skinCount / sampled;
        const contrast = maxLum - minLum;
        // Face region must have skin chrominance and facial texture contrast (eyes/nose/mouth)
        if (skinRatio >= 0.30 && contrast >= 10) {
          grid[r][c] = 1;
        }
      }
    }

    // 3. Connected components clustering (Breadth-First Search)
    const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
    const blobs = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1 && !visited[r][c]) {
          let area = 0;
          let minX = c, maxX = c, minY = r, maxY = r;
          let sumX = 0, sumY = 0;

          const queue = [[r, c]];
          visited[r][c] = 1;

          while (queue.length > 0) {
            const [currR, currC] = queue.shift();
            area++;
            sumX += currC;
            sumY += currR;
            if (currC < minX) minX = currC;
            if (currC > maxX) maxX = currC;
            if (currR < minY) minY = currR;
            if (currR > maxY) maxY = currR;

            const neighbors = [
              [currR - 1, currC],
              [currR + 1, currC],
              [currR, currC - 1],
              [currR, currC + 1]
            ];
            for (const [nr, nc] of neighbors) {
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !visited[nr][nc]) {
                visited[nr][nc] = 1;
                queue.push([nr, nc]);
              }
            }
          }

          const widthCells = maxX - minX + 1;
          const heightCells = maxY - minY + 1;
          const aspect = heightCells / Math.max(1, widthCells);

          // Valid human face blob threshold (size & aspect ratio)
          if (area >= 5 && area <= 110 && aspect >= 0.5 && aspect <= 2.5) {
            blobs.push({
              area,
              minX, maxX, minY, maxY,
              centerX: sumX / area,
              centerY: sumY / area
            });
          }
        }
      }
    }

    // Merge closely adjacent components (e.g. neck & face)
    const distinctFaces = [];
    for (const b of blobs) {
      const existing = distinctFaces.find(f => {
        const dx = Math.abs(f.centerX - b.centerX);
        const dy = Math.abs(f.centerY - b.centerY);
        return dx < 3.5 && dy < 3.5;
      });
      if (existing) {
        existing.area += b.area;
        existing.centerX = (existing.centerX + b.centerX) / 2;
        existing.centerY = (existing.centerY + b.centerY) / 2;
      } else {
        distinctFaces.push({ ...b });
      }
    }

    if (distinctFaces.length === 0) {
      return { faceCount: 0, state: 'NO_FACE' };
    } else if (distinctFaces.length === 1) {
      return { faceCount: 1, state: 'ONE_FACE' };
    } else {
      return { faceCount: distinctFaces.length, state: 'MULTIPLE_FACES' };
    }
  }, []);

  /**
   * Continuous frame monitoring loop
   */
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !isStreaming || !faceDetectionEnabled) return;

    try {
      let count = 1;
      let state = 'ONE_FACE';

      if (nativeDetectorRef.current && videoRef.current.readyState >= 2) {
        try {
          const faces = await nativeDetectorRef.current.detect(videoRef.current);
          count = faces.length;
          if (count === 0) state = 'NO_FACE';
          else if (count === 1) state = 'ONE_FACE';
          else state = 'MULTIPLE_FACES';
        } catch (e) {
          const result = analyzeCanvasFrame(videoRef.current);
          count = result.faceCount;
          state = result.state || 'ONE_FACE';
        }
      } else {
        const result = analyzeCanvasFrame(videoRef.current);
        count = result.faceCount;
        state = result.state || 'ONE_FACE';
      }

      setFaceCount(count);
      setDetectionState(state);

      if (DEBUG_PROCTOR) {
        console.log(`[PROCTOR] faces detected: ${count} (${state})`);
      }

      // -----------------------------------------------------------------------
      // NO-FACE DETECTION & DEBOUNCE (State Machine)
      // -----------------------------------------------------------------------
      if (state === 'NO_FACE') {
        // Reset multi-face timer
        multiFaceSecondsRef.current = 0;
        multiFaceWarnedRef.current = false;

        if (!faceAbsentWarnedRef.current) {
          absenceSecondsRef.current += 1;
          if (DEBUG_PROCTOR) {
            console.log(`[PROCTOR] Absence duration: ${absenceSecondsRef.current}/${absenceThresholdSeconds}s`);
          }

          if (absenceSecondsRef.current >= absenceThresholdSeconds) {
            faceAbsentWarnedRef.current = true;
            setWarningMessage('Your face is not clearly visible. Please adjust your camera or lighting to remain on screen.');
            if (DEBUG_PROCTOR) console.log('[PROCTOR] Emitting FACE_NOT_DETECTED violation');
            notifyViolation('FACE_NOT_DETECTED', { duration_seconds: absenceSecondsRef.current });
          }
        }
      } else {
        // Face returned: reset absence timer and warning lock
        if (absenceSecondsRef.current > 0 || faceAbsentWarnedRef.current) {
          if (DEBUG_PROCTOR) console.log('[PROCTOR] Face returned. Absence timer and violation state reset.');
        }
        absenceSecondsRef.current = 0;
        faceAbsentWarnedRef.current = false;
      }

      // -----------------------------------------------------------------------
      // MULTIPLE-FACE DETECTION & DEBOUNCE (State Machine)
      // -----------------------------------------------------------------------
      if (state === 'MULTIPLE_FACES') {
        // Reset absence timer
        absenceSecondsRef.current = 0;
        faceAbsentWarnedRef.current = false;

        if (!multiFaceWarnedRef.current) {
          multiFaceSecondsRef.current += 1;
          if (DEBUG_PROCTOR) {
            console.log(`[PROCTOR] Multi-face duration: ${multiFaceSecondsRef.current}/${multiFaceThresholdSeconds}s`);
          }

          if (multiFaceSecondsRef.current >= multiFaceThresholdSeconds) {
            multiFaceWarnedRef.current = true;
            setWarningMessage('Multiple faces detected in camera view. Ensure you are taking this examination alone.');
            if (DEBUG_PROCTOR) console.log('[PROCTOR] Emitting MULTIPLE_FACES violation');
            notifyViolation('MULTIPLE_FACES', { face_count: count });
          }
        }
      } else {
        // Extra faces cleared: reset multi-face timer and warning lock
        if (multiFaceSecondsRef.current > 0 || multiFaceWarnedRef.current) {
          if (DEBUG_PROCTOR) console.log('[PROCTOR] Extra faces cleared. Multi-face timer reset.');
        }
        multiFaceSecondsRef.current = 0;
        multiFaceWarnedRef.current = false;
      }

      // Normal single face: clear warning message
      if (state === 'ONE_FACE' && absenceSecondsRef.current === 0 && multiFaceSecondsRef.current === 0) {
        setWarningMessage(null);
      }
    } catch (err) {
      if (DEBUG_PROCTOR) console.warn('[WebcamProctor] Detection frame error:', err.message);
    }
  }, [isStreaming, faceDetectionEnabled, notifyViolation, absenceThresholdSeconds, multiFaceThresholdSeconds, analyzeCanvasFrame]);

  /**
   * Request user camera permission and start video stream
   */
  const startCamera = useCallback(async () => {
    if (!enabled || isCancelledRef.current) return;
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support webcam capture.');
      }

      // If already streaming, reattach if needed and return
      if (streamRef.current && streamRef.current.active) {
        if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
        setIsStreaming(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      // Abort check if camera was stopped or disabled while awaiting getUserMedia
      if (isCancelledRef.current || !enabled) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {}
        });
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.warn('Autoplay prevented:', e));
        };
      }

      setHasPermission(true);
      setIsStreaming(true);
      setDetectionState('ONE_FACE');
      setError(null);

      // Listen for video track ending
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          setIsStreaming(false);
          setDetectionState('ERROR');
          setError('Camera track disconnected.');
          if (DEBUG_PROCTOR) console.log('[PROCTOR] Camera video track ended abruptly');
          notifyViolation('CAMERA_DISCONNECTED', { reason: 'Video track ended abruptly' });
        };
      });

      // Listen for hardware device unplugging/removal
      if (navigator.mediaDevices && !deviceChangeListenerRef.current) {
        deviceChangeListenerRef.current = () => {
          navigator.mediaDevices.enumerateDevices().then(devices => {
            const hasVideo = devices.some(d => d.kind === 'videoinput');
            if (!hasVideo && streamRef.current) {
              setIsStreaming(false);
              setDetectionState('ERROR');
              setError('Camera disconnected.');
              notifyViolation('CAMERA_DISCONNECTED', { reason: 'No videoinput devices found on system' });
            }
          }).catch(() => {});
        };
        navigator.mediaDevices.addEventListener('devicechange', deviceChangeListenerRef.current);
      }
    } catch (err) {
      if (isCancelledRef.current || !enabled) return;
      console.error('[WebcamProctor] Camera failure:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Camera permission is required for this test. Please enable camera access in your browser settings.'
        : (err.message || 'Camera device unavailable or disconnected.');
      setError(msg);
      setHasPermission(false);
      setIsStreaming(false);
      setDetectionState('ERROR');

      notifyViolation(
        isDenied ? 'CAMERA_PERMISSION_REVOKED' : 'CAMERA_DISCONNECTED',
        { message: err.message, name: err.name }
      );
    }
  }, [enabled, notifyViolation]);

  /**
   * Safely and idempotently stop camera stream and release hardware
   */
  const stopCamera = useCallback(() => {
    isCancelledRef.current = true;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (deviceChangeListenerRef.current && navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener('devicechange', deviceChangeListenerRef.current);
      deviceChangeListenerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore cleanup error
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      if (videoRef.current.srcObject && typeof videoRef.current.srcObject.getTracks === 'function') {
        videoRef.current.srcObject.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {}
        });
      }
      videoRef.current.srcObject = null;
    }

    absenceSecondsRef.current = 0;
    multiFaceSecondsRef.current = 0;
    faceAbsentWarnedRef.current = false;
    multiFaceWarnedRef.current = false;
    setIsStreaming(false);
  }, []);

  // Ensure video element receives the stream when active
  useEffect(() => {
    if (enabled && isStreaming && videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Autoplay prevented:', e));
    }
  }, [enabled, isStreaming]);

  // Synchronize camera running state with enabled prop
  useEffect(() => {
    if (enabled) {
      isCancelledRef.current = false;
      if (!isStreaming && !streamRef.current) {
        startCamera();
      }
    } else {
      stopCamera();
    }
  }, [enabled, isStreaming, startCamera, stopCamera]);

  // Frame processing timer loop (~ 1.0 second intervals for precise timing)
  useEffect(() => {
    if (enabled && isStreaming && faceDetectionEnabled) {
      intervalRef.current = setInterval(processFrame, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isStreaming, faceDetectionEnabled, processFrame]);

  // Cleanup camera on component unmount and browser unload/pagehide
  useEffect(() => {
    const handleBrowserUnload = () => {
      stopCamera();
    };

    window.addEventListener('beforeunload', handleBrowserUnload);
    window.addEventListener('pagehide', handleBrowserUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBrowserUnload);
      window.removeEventListener('pagehide', handleBrowserUnload);
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    startCamera,
    stopCamera,
    hasPermission,
    isStreaming,
    error,
    detectionState,
    faceCount,
    warningMessage
  };
}
