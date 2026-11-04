#!/usr/bin/env python3
"""Quick check printing today_tokens, last_24h_tokens, and tokens_total for default and ops profiles,
and verifying 9 fleet roles in state with role, profile, and virtual fields."""
import sys
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(repo / 'dashboard'))
import plugin_api

def main():
    print('=== Telemetry Quick Check ===')
    for profile in ['default', 'ops']:
        stats = plugin_api._read_session_stats(profile)
        print(f'[{profile}]')
        print(f'  tokens_total:    {stats.get("tokens_total", 0):,}')
        print(f'  today_tokens:    {stats.get("today_tokens", 0):,}')
        print(f'  last_24h_tokens: {stats.get("last_24h_tokens", 0):,}')
        assert 'tokens_total' in stats, f'missing tokens_total in {profile}'
        assert 'today_tokens' in stats, f'missing today_tokens in {profile}'
        assert 'last_24h_tokens' in stats, f'missing last_24h_tokens in {profile}'

    print('\n=== Fleet Roles Check ===')
    state = plugin_api._collect_state()
    print(f'Total fleet entries: {len(state)}')
    assert len(state) == 9, f'Expected 9 entries, got {len(state)}'
    for entry in state:
        p = entry['profile']
        r = entry['role']
        v = entry['virtual']
        t = entry['tokens_total']
        today = entry['today_tokens']
        l24 = entry['last_24h_tokens']
        print(f'  profile={p:<14} role={r:<14} virtual={str(v):<6} tokens={t:<10} today={today:<10} last_24h={l24}')
        assert isinstance(v, bool), f'virtual must be bool in {entry}'
        if p == 'default':
            assert r == 'orchestrator' and v is False
        elif p == 'ops':
            assert r == 'ops' and v is False
        else:
            assert v is True and r == p

    print('\nAll checks passed successfully.')

if __name__ == '__main__':
    main()
