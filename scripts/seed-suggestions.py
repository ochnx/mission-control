#!/usr/bin/env python3
"""Seed mc_suggestions with sample data for Smart Suggestions feature."""

import os
import json
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests")
    exit(1)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://lvhxabadywdqeepymwdm.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aHhhYmFkeXdkcWVlcHltd2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUyMjM3NSwiZXhwIjoyMDg1MDk4Mzc1fQ.3BWQG5yeG8nshvukSi3YksxUbg273tJDiZnU9fAlzY0")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

SUGGESTIONS = [
    {
        "suggestion_type": "overdue_task",
        "title": "3 Overdue Tasks seit > 7 Tagen",
        "description": "Es gibt 3 Tasks die seit mehr als einer Woche überfällig sind. Priorisierung empfohlen.",
        "action_type": "review_tasks",
        "priority": "high",
        "status": "pending",
    },
    {
        "suggestion_type": "follow_up",
        "title": "Lisa-Marie Robin (moovin): Kein Kontakt seit 7 Tagen",
        "description": "Letzte Interaktion war vor 7 Tagen. Follow-up empfohlen um den Kontakt warm zu halten.",
        "action_type": "send_reminder",
        "priority": "medium",
        "status": "pending",
    },
    {
        "suggestion_type": "deal_action",
        "title": "E&V Frankfurt: Max zurück am 20.02 — Reminder setzen?",
        "description": "Maximilian Münz ist ab 20.02. wieder erreichbar. Jetzt Reminder setzen für rechtzeitiges Follow-up.",
        "action_type": "create_task",
        "priority": "medium",
        "status": "pending",
    },
    {
        "suggestion_type": "calendar_gap",
        "title": "Morgen Shoot E&V Große Elbstraße — Equipment ready?",
        "description": "Shoot morgen geplant. Equipment-Check empfohlen: Kamera, Drohne, Akkus, SD-Karten.",
        "action_type": "create_task",
        "priority": "high",
        "status": "pending",
    },
]


def main():
    url = f"{SUPABASE_URL}/rest/v1/mc_suggestions"

    print(f"Seeding {len(SUGGESTIONS)} suggestions into mc_suggestions...")

    resp = requests.post(url, headers=HEADERS, data=json.dumps(SUGGESTIONS))

    if resp.status_code in (200, 201):
        data = resp.json()
        print(f"Successfully inserted {len(data)} suggestions:")
        for s in data:
            print(f"  [{s['priority'].upper()}] {s['type']}: {s['title']}")
    else:
        print(f"ERROR {resp.status_code}: {resp.text}")
        exit(1)


if __name__ == "__main__":
    main()
