import json
import os
import filecmp

laws_path = 'd:/1/copyright_law_viewer/public/laws.json'
public_berne = 'd:/1/copyright_law_viewer/public/berne.json'
local_berne = 'd:/1/wipo_berne/berne.json'

print("--- Verifying laws.json ---")
try:
    with open(laws_path, 'r', encoding='utf-8') as f:
        json.load(f)
    print("laws.json is valid JSON.")
except Exception as e:
    print(f"ERROR: laws.json is invalid: {e}")

print("\n--- Comparing berne.json ---")
if os.path.exists(public_berne) and os.path.exists(local_berne):
    # Load and compare content to ignore formatting differences
    try:
        with open(public_berne, 'r', encoding='utf-8') as f1, open(local_berne, 'r', encoding='utf-8') as f2:
            j1 = json.load(f1)
            j2 = json.load(f2)
            if j1 == j2:
                 print("berne.json content is identical.")
            else:
                 print("berne.json content DIFFERS.")
                 # Check specific article 38/39 differences if needed
    except Exception as e:
        print(f"Error comparing: {e}")
else:
    print("One of the berne.json files is missing.")
