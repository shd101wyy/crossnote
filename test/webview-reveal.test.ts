import { withoutSlideTransition } from '../src/webview/lib/reveal';

function fakeReveal(transition?: string) {
  const config: { transition?: string } =
    transition === undefined ? {} : { transition };
  const calls: string[] = [];
  return {
    calls,
    config,
    reveal: {
      getConfig: () => config,
      configure: ({ transition }: { transition?: string }) => {
        calls.push(String(transition));
        config.transition = transition;
      },
    },
  };
}

describe('withoutSlideTransition', () => {
  it('switches the transition off for the action and the configured one back on', () => {
    // The preview used to switch `slide` back on regardless of what the
    // presentation was configured with.
    const { reveal, calls, config } = fakeReveal('none');
    const seen: string[] = [];

    withoutSlideTransition(reveal, () => seen.push(String(config.transition)));

    expect(seen).toEqual(['none']);
    expect(calls).toEqual(['none', 'none']);
    expect(config.transition).toBe('none');
  });

  it('puts back whichever transition was configured', () => {
    const { reveal, config } = fakeReveal('fade');

    withoutSlideTransition(reveal, () => {});

    expect(config.transition).toBe('fade');
  });

  it('falls back to the default transition when none is configured', () => {
    const { reveal, config } = fakeReveal();

    withoutSlideTransition(reveal, () => {});

    expect(config.transition).toBe('default');
  });

  it('puts the transition back even when the action throws', () => {
    const { reveal, config } = fakeReveal('fade');

    expect(() =>
      withoutSlideTransition(reveal, () => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
    expect(config.transition).toBe('fade');
  });
});
