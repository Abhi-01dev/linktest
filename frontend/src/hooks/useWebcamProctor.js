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
  onEvent = null,
  absenceThresholdSeconds = 5,
  multiFaceThresholdSeconds = 3
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const deviceChangeListenerRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [detectionState, setDetectionState] = useState('CHECKING'); // 'ONE_FACE', 'NO_FACE', 'MULTIPLE_FACES', 'UNCERTAIN', 'ERROR'
  const [faceCount, setFaceCount] = useState(1);
  const [warningMessage, setWarningMessage] = useState(null);

  // Counters for continuous state transitions
  const absenceSecondsRef = useRef(0);
  const multiFaceSecondsRef = useRef(0);
  const hasEmittedAbsenceWarningRef = useRef(false);
  const hasEmittedMultiFaceWarningRef = useRef(false);
  const nativeDetectorRef = useRef(null);

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
    if (meanLuminance < 12) {
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

            const isSkin = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 &&
                           red > 45 && green > 30 && blue > 20 &&
                           red > green && red > blue &&
                           Math.abs(red - green) > 8;

            if (isSkin) skinCount++;
            sampled++;
          }
        }

        const skinRatio = skinCount / sampled;
        const contrast = maxLum - minLum;
        // Face region must have both skin chrominance and facial texture contrast (eyes/nose/mouth)
        if (skinRatio >= 0.35 && contrast >= 15) {
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
      // NO-FACE DETECTION & DEBOUNCE
      // -----------------------------------------------------------------------
      if (state === 'NO_FACE') {
        // Reset multi-face timer
        multiFaceSecondsRef.current = 0;
        hasEmittedMultiFaceWarningRef.current = false;

        absenceSecondsRef.current += 1;
        if (DEBUG_PROCTOR) {
          console.log(`[PROCTOR] Absence duration: ${absenceSecondsRef.current}/${absenceThresholdSeconds}s`);
        }

        if (absenceSecondsRef.current >= absenceThresholdSeconds) {
          setWarningMessage('Your face is not clearly visible. Please adjust your camera or lighting to remain on screen.');
          if (!hasEmittedAbsenceWarningRef.current) {
            hasEmittedAbsenceWarningRef.current = true;
            if (DEBUG_PROCTOR) console.log('[PROCTOR] event sent: FACE_NOT_DETECTED');
            if (onEvent) {
              onEvent({
                event_type: 'FACE_NOT_DETECTED',
                severity: 'warning',
                metadata: { duration_seconds: absenceSecondsRef.current }
              });
            }
          }
        }
      } else {
        // Face returned before or after threshold: reset absence timer immediately
        if (absenceSecondsRef.current > 0 && DEBUG_PROCTOR) {
          console.log('[PROCTOR] Face returned. Absence timer reset.');
        }
        absenceSecondsRef.current = 0;
        hasEmittedAbsenceWarningRef.current = false;
      }

      // -----------------------------------------------------------------------
      // MULTIPLE-FACE DETECTION & DEBOUNCE
      // -----------------------------------------------------------------------
      if (state === 'MULTIPLE_FACES') {
        // Reset absence timer
        absenceSecondsRef.current = 0;
        hasEmittedAbsenceWarningRef.current = false;

        multiFaceSecondsRef.current += 1;
        if (DEBUG_PROCTOR) {
          console.log(`[PROCTOR] Multi-face duration: ${multiFaceSecondsRef.current}/${multiFaceThresholdSeconds}s`);
        }

        if (multiFaceSecondsRef.current >= multiFaceThresholdSeconds) {
          setWarningMessage('Multiple faces detected in camera view. Ensure you are taking this examination alone.');
          if (!hasEmittedMultiFaceWarningRef.current) {
            hasEmittedMultiFaceWarningRef.current = true;
            if (DEBUG_PROCTOR) console.log('[PROCTOR] event sent: MULTIPLE_FACES');
            if (onEvent) {
              onEvent({
                event_type: 'MULTIPLE_FACES',
                severity: 'warning',
                metadata: { face_count: count }
              });
            }
          }
        }
      } else {
        // Multiple faces cleared / returned to single face: cancel warning timer
        if (multiFaceSecondsRef.current > 0 && DEBUG_PROCTOR) {
          console.log('[PROCTOR] Multi-face cleared. Multiple-face timer reset.');
        }
        multiFaceSecondsRef.current = 0;
        hasEmittedMultiFaceWarningRef.current = false;
      }

      // Normal single face: clear all warning messages
      if (state === 'ONE_FACE' && absenceSecondsRef.current === 0 && multiFaceSecondsRef.current === 0) {
        setWarningMessage(null);
      }
    } catch (err) {
      if (DEBUG_PROCTOR) console.warn('[WebcamProctor] Detection frame error:', err.message);
    }
  }, [isStreaming, faceDetectionEnabled, onEvent, absenceThresholdSeconds, multiFaceThresholdSeconds, analyzeCanvasFrame]);

  /**
   * Request user camera permission and start video stream
   */
  const startCamera = useCallback(async () => {
    if (!enabled) return;
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support webcam capture.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

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

      // Listen for track ending/disconnection
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          setIsStreaming(false);
          setDetectionState('ERROR');
          setError('Camera track disconnected.');
          if (DEBUG_PROCTOR) console.log('[PROCTOR] Camera video track ended abruptly');
          if (onEvent) {
            onEvent({
              event_type: 'CAMERA_DISCONNECTED',
              severity: 'critical',
              metadata: { reason: 'Video track ended abruptly' }
            });
          }
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
              if (onEvent) {
                onEvent({
                  event_type: 'CAMERA_DISCONNECTED',
                  severity: 'critical',
                  metadata: { reason: 'No videoinput devices found on system' }
                });
              }
            }
          }).catch(() => {});
        };
        navigator.mediaDevices.addEventListener('devicechange', deviceChangeListenerRef.current);
      }
    } catch (err) {
      console.error('[WebcamProctor] Camera permission or device failure:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Camera permission is required for this test. Please enable camera access in your browser settings.'
        : (err.message || 'Camera device unavailable or disconnected.');
      setError(msg);
      setHasPermission(false);
      setIsStreaming(false);
      setDetectionState('ERROR');

      if (onEvent) {
        onEvent({
          event_type: isDenied ? 'CAMERA_PERMISSION_REVOKED' : 'CAMERA_DISCONNECTED',
          severity: 'critical',
          metadata: { message: err.message, name: err.name }
        });
      }
    }
  }, [enabled, onEvent]);

  /**
   * Safely stop camera stream and release hardware
   */
  const stopCamera = useCallback(() => {
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
      videoRef.current.srcObject = null;
    }

    absenceSecondsRef.current = 0;
    multiFaceSecondsRef.current = 0;
    hasEmittedAbsenceWarningRef.current = false;
    hasEmittedMultiFaceWarningRef.current = false;
    setIsStreaming(false);
  }, []);

  // Frame processing timer loop (~ 1.0 second intervals for precise timing)
  useEffect(() => {
    if (isStreaming && faceDetectionEnabled) {
      intervalRef.current = setInterval(processFrame, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStreaming, faceDetectionEnabled, processFrame]);

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
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
