/**
 * The imgur uploader's `IMGUR_API_URL` override must never turn the
 * uploader into a probe of the local network: it is only allowed to point
 * at a public http(s) host, so upload payloads (and the client id) cannot
 * be redirected at localhost / private / reserved addresses.
 */
import { resolveImgurApiUrl } from '../src/tools/image-uploader';

describe('resolveImgurApiUrl', () => {
  const originalOverride = process.env.IMGUR_API_URL;

  afterEach(() => {
    if (originalOverride === undefined) {
      delete process.env.IMGUR_API_URL;
    } else {
      process.env.IMGUR_API_URL = originalOverride;
    }
  });

  test('defaults to the public imgur endpoint', () => {
    delete process.env.IMGUR_API_URL;
    expect(resolveImgurApiUrl()).toBe('https://api.imgur.com/3/');
  });

  test.each([
    'https://imgur-proxy.example.org/3/',
    'http://imgur-proxy.example.org:8443/3/',
    'https://1.1.1.1/3/', // arbitrary public IP
  ])('accepts a public http(s) override: %s', (override) => {
    process.env.IMGUR_API_URL = override;
    expect(resolveImgurApiUrl()).toBe(new URL(override).toString());
  });

  test.each([
    ['not a url'],
    ['ftp://api.imgur.com/3/'],
    ['file:///etc/passwd'],
    ['https://localhost/3/'],
    ['https://api.localhost/3/'],
    ['https://printer.local/3/'],
    ['https://127.0.0.1/3/'],
    ['https://127.8.8.8/3/'],
    ['https://0.0.0.0/3/'],
    ['https://10.1.2.3/3/'],
    ['https://172.16.0.9/3/'],
    ['https://172.31.255.255/3/'],
    ['https://192.168.1.1/3/'],
    ['https://169.254.169.254/3/'], // cloud metadata endpoint
    ['https://100.64.0.1/3/'], // CGNAT
    ['https://[::1]/3/'],
    ['https://[fe80::1]/3/'],
    ['https://[fd12:3456::1]/3/'],
    ['https://[::ffff:10.0.0.1]/3/'], // IPv4-mapped private
    ['https://224.0.0.1/3/'], // multicast
    ['https://240.1.2.3/3/'], // reserved
  ])('rejects override: %s', (override) => {
    process.env.IMGUR_API_URL = override;
    expect(() => resolveImgurApiUrl()).toThrow(/IMGUR_API_URL/);
  });
});
