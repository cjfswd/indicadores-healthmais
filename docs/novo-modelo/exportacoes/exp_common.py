# -*- coding: utf-8 -*-
import json, re

D = json.load(open('painel.json', encoding='utf-8'))
CARDS = D['cards']
COMP = D['competencia']

# Paleta do painel
PINE   = "1F5F52"
PINE_L = "E4EFEA"
BRICK  = "A3462F"
BRICK_L= "F6E9E4"
INK    = "15211D"
INK2   = "47554F"
INK3   = "77857E"
LINE   = "E0E5E1"
SURF2  = "FAFBFA"
SAND   = "9A7B1F"

def num(s):
    """'R$ 1.284,40' -> 1284.4 ; '25%' -> 25.0 ; '—' -> None ; '12' -> 12"""
    if s is None: return None
    s = s.strip()
    if s in ('', '—', '-'): return None
    t = s.replace('R$', '').replace('%', '').strip()
    t = t.replace('.', '').replace(',', '.')
    try:
        v = float(t)
        return int(v) if v == int(v) and '.' not in s.replace('.', '', 0) else v
    except ValueError:
        return None

def is_money(s):
    return isinstance(s, str) and 'R$' in s

def is_pct(s):
    return isinstance(s, str) and s.strip().endswith('%')

def limpa(s):
    return re.sub(r'\s+', ' ', (s or '')).strip()
