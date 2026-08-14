import { sendReleaseNotesEmail } from '../utils/mailer.js';
import { jest } from '@jest/globals';

describe('Mailer - Release Notes', () => {
  let originalEnv;
  let originalFetch;

  beforeAll(() => {
    originalEnv = process.env;
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('sends release notes email via Resend API when RESEND_API_KEY is present', async () => {
    process.env.RESEND_API_KEY = 'test_resend_key';
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'resend_123' })
    });

    const result = await sendReleaseNotesEmail('test@test.com', 'v1.1.0');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test_resend_key'
      })
    }));

    // Verify the payload contains the version
    const fetchArgs = global.fetch.mock.calls[0];
    const bodyStr = fetchArgs[1].body;
    expect(bodyStr).toContain('v1.1.0');
    expect(bodyStr).toContain('test@test.com');
    
    expect(result.success).toBe(true);
  });

  it('returns failure if Resend API fails', async () => {
    process.env.RESEND_API_KEY = 'test_resend_key';
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid API key' })
    });

    const result = await sendReleaseNotesEmail('test@test.com', 'v1.1.0');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });
});
