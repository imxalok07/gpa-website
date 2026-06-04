import csv
import json

rows = []

with open("timeline.csv", encoding="utf-8") as file:
    reader = csv.DictReader(file)

    for i, row in enumerate(reader, start=1):
        rows.append({
            "id": i,
            "year": row.get("Year", ""),
            "date": row.get("Date", ""),
            "place": row.get("Place", ""),
            "category": row.get("Category", ""),
            "title": row.get("Event", ""),
            "text": row.get("Detailed Narrative Description", "")
        })

with open("data/timeline.json", "w", encoding="utf-8") as file:
    json.dump(rows, file, indent=2, ensure_ascii=False)