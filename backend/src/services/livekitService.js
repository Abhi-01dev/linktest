import crypto from 'crypto';
import { config } from '../config/env.js';

/**
 * Service for LiveKit WebRTC Video Classes
 * Provides token creation when credentials exist, and fallback status when unconfigured.
 */
export class LiveKitService {
  constructor() {
    this.serverUrl = config.livekit.serverUrl;
    this.apiKey = config.livekit.apiKey;
    this.apiSecret = config.livekit.apiSecret;
  }

  isConfigured() {
    return Boolean(this.serverUrl && this.apiKey && this.apiSecret);
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      serverUrl: this.isConfigured() ? this.serverUrl : null,
      provider: this.isConfigured() ? 'livekit' : 'external_fallback',
      message: this.isConfigured()
        ? 'LiveKit WebRTC service is configured and ready.'
        : 'LiveKit server credentials are unconfigured. External meeting links (Zoom/Meet/Teams) are used as fallback.'
    };
  }

  /**
   * Generate LiveKit Access Token
   * Follows LiveKit JWT grant specification:
   * header: { alg: "HS256", typ: "JWT" }
   * claims: { iss: apiKey, sub: identity, video: { room, roomJoin: true, ... } }
   */
  generateToken({ roomName, participantIdentity, participantName, isPublisher = false }) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        error: 'LIVEKIT_NOT_CONFIGURED',
        message: 'LiveKit credentials are not configured on this server. Please use external meeting fallback.'
      };
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const ttl = 6 * 3600; // 6 hours

      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      const payload = {
        iss: this.apiKey,
        sub: participantIdentity,
        name: participantName,
        iat: now,
        nbf: now,
        exp: now + ttl,
        video: {
          room: roomName,
          roomJoin: true,
          canPublish: Boolean(isPublisher),
          canSubscribe: true,
          canPublishData: true
        }
      };

      const base64UrlEncode = (obj) => {
        return Buffer.from(JSON.stringify(obj))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
      };

      const encodedHeader = base64UrlEncode(header);
      const encodedPayload = base64UrlEncode(payload);
      const signatureInput = `${encodedHeader}.${encodedPayload}`;

      const hmac = crypto.createHmac('sha256', this.apiSecret);
      hmac.update(signatureInput);
      const signature = hmac.digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const jwtToken = `${signatureInput}.${signature}`;

      return {
        success: true,
        configured: true,
        token: jwtToken,
        serverUrl: this.serverUrl,
        roomName,
        participantIdentity
      };
    } catch (err) {
      console.error('[LiveKitService] Token generation failed:', err.message);
      return {
        success: false,
        configured: true,
        error: 'TOKEN_GENERATION_FAILED',
        message: err.message
      };
    }
  }
}

export const livekitService = new LiveKitService();
