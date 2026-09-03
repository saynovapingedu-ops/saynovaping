import { describe, it, expect } from 'vitest';
import { isInLineBrowser, openInExternalBrowser } from './liff';

describe('liff helpers', () => {
  it('isInLineBrowser ตรวจจับ User Agent ของ LINE ได้ถูกต้อง', () => {
    const originalUserAgent = navigator.userAgent;
    try {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Mobile Safari/537.36 Line/12.14.1',
        configurable: true,
      });
      expect(isInLineBrowser()).toBe(true);

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
      expect(isInLineBrowser()).toBe(false);
    } finally {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    }
  });

  it('openInExternalBrowser ทำงานได้โดยไม่ throw error', () => {
    expect(() => {
      openInExternalBrowser('https://example.com');
    }).not.toThrow();
  });
});
