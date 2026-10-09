"""Seed security insights into Firestore (emulator only by default)."""
import json
import os
import sys

# Ensure ai-service root in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.firebase_app import get_firestore_db

INSIGHTS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "security_insights.json",
)


def seed():
    if not os.path.exists(INSIGHTS_PATH):
        print(f"File not found: {INSIGHTS_PATH}")
        sys.exit(1)

    with open(INSIGHTS_PATH, "r", encoding="utf-8") as f:
        insights = json.load(f)

    db = get_firestore_db()
    if db is None:
        print("Failed to initialize Firestore Admin SDK")
        sys.exit(1)

    print(f"Seeding {len(insights)} security insights...")
    batch = db.batch()
    for item in insights:
        doc_id = item["id"]
        doc_ref = db.collection("securityInsights").document(doc_id)
        batch.set(doc_ref, {
            "id": doc_id,
            "category": item["category"],
            "title": item["title"],
            "content": item["content"],
        })

    batch.commit()
    print("Successfully seeded securityInsights collection.")


if __name__ == "__main__":
    seed()
