import bz2
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

INPUT = ROOT / "src" / "data" / "3812.jsonl.bz2"
OUTPUT = ROOT / "src" / "data" / "tracking_sample.json"

frames = []
total_lines = 0
skipped_lines = 0

print("Reading complete tracking data...")
print(f"Input: {INPUT}")

if not INPUT.exists():
    raise FileNotFoundError(
        f"Tracking file not found: {INPUT}"
    )

with bz2.open(INPUT, "rt", encoding="utf-8") as file:
    for line in file:
        if not line.strip():
            continue

        total_lines += 1

        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            skipped_lines += 1
            print(f"Warning: Invalid JSON at line {total_lines}")
            continue

        home = (
            record.get("homePlayersSmoothed")
            or record.get("homePlayers")
            or []
        )

        away = (
            record.get("awayPlayersSmoothed")
            or record.get("awayPlayers")
            or []
        )

        ball = (
            record.get("ballsSmoothed")
            or record.get("balls")
            or []
        )

        if isinstance(ball, list):
            ball = ball[0] if ball else None

        frame = {
            "frameNum": record.get("frameNum"),
            "videoTimeMs": record.get("videoTimeMs"),
            "period": record.get("period"),
            "periodElapsedTime": record.get("periodElapsedTime"),
            "periodGameClockTime": record.get("periodGameClockTime"),
            "homePlayers": home,
            "awayPlayers": away,
            "ball": ball,
        }

        frames.append(frame)

        # Print progress every 10,000 records
        if total_lines % 10000 == 0:
            print(
                f"Processed: {total_lines:,} records | "
                f"Valid frames: {len(frames):,}"
            )

print("\nReading completed.")
print(f"Total records read: {total_lines:,}")
print(f"Valid frames: {len(frames):,}")
print(f"Skipped invalid records: {skipped_lines:,}")

if not frames:
    raise ValueError(
        "No valid tracking frames were found in the input file."
    )

print("\nSaving complete tracking data...")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT.open("w", encoding="utf-8") as file:
    json.dump(
        frames,
        file,
        ensure_ascii=False,
        separators=(",", ":")
    )

print(f"Output saved to: {OUTPUT}")
print(f"Output size: {OUTPUT.stat().st_size / (1024 * 1024):.2f} MB")

print("\nFirst frame:")
print(json.dumps(frames[0], ensure_ascii=False)[:1500])

print("\nLast frame:")
print(json.dumps(frames[-1], ensure_ascii=False)[:1000])