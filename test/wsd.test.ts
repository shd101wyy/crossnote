import { encodeWsdText, buildWsdImageUrl } from '../src/renderers/wsd';

describe('WebSequenceDiagrams renderer', () => {
  describe('encodeWsdText', () => {
    test('should encode simple text', () => {
      const encoded = encodeWsdText('A->B: Hello');
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      // URL-safe Base64: only contains [A-Za-z0-9-_]
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('should produce different output for different inputs', () => {
      const a = encodeWsdText('A->B: Hello');
      const b = encodeWsdText('A->B: World');
      expect(a).not.toBe(b);
    });

    test('should handle multi-line diagram text', () => {
      const text =
        'Alice->Bob: Authentication Request\nBob-->Alice: Authentication Response';
      const encoded = encodeWsdText(text);
      expect(encoded).toBeTruthy();
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('should handle unicode characters', () => {
      const encoded = encodeWsdText('A->B: こんにちは');
      expect(encoded).toBeTruthy();
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('buildWsdImageUrl', () => {
    const server = 'https://www.websequencediagrams.com';

    test('should build URL with encoded text', () => {
      const url = buildWsdImageUrl('A->B: Hello', server);
      expect(url).toContain(`${server}/cgi-bin/cdraw?lz=`);
    });

    test('should include style parameter when provided', () => {
      const url = buildWsdImageUrl('A->B: Hello', server, 'modern-blue');
      expect(url).toContain('&s=modern-blue');
    });

    test('should include API key when provided', () => {
      const url = buildWsdImageUrl('A->B: Hello', server, 'default', 'my-key');
      expect(url).toContain('&apikey=my-key');
    });

    test('should not include style when not provided', () => {
      const url = buildWsdImageUrl('A->B: Hello', server);
      expect(url).not.toContain('&s=');
    });

    test('should not include API key when not provided', () => {
      const url = buildWsdImageUrl('A->B: Hello', server);
      expect(url).not.toContain('&apikey=');
    });

    test('should work with custom server URL', () => {
      const customServer = 'https://my-wsd.example.com';
      const url = buildWsdImageUrl('A->B: Hello', customServer);
      expect(url).toContain(`${customServer}/cgi-bin/cdraw?lz=`);
    });
  });
});
