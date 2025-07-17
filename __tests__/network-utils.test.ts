import { isOnline, isOnlineWithFallback } from '../src/main/helpers/network-utils';

describe('Network Utils', () => {
  describe('isOnline', () => {
    it('should return a boolean value', async () => {
      const result = await isOnline();
      expect(typeof result).toBe('boolean');
    });

    it('should handle timeout correctly', async () => {
      const result = await isOnline(1000); // 1 second timeout
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isOnlineWithFallback', () => {
    it('should return a boolean value', async () => {
      const result = await isOnlineWithFallback();
      expect(typeof result).toBe('boolean');
    });

    it('should handle timeout correctly', async () => {
      const result = await isOnlineWithFallback(1000); // 1 second timeout
      expect(typeof result).toBe('boolean');
    });
  });
}); 