
import json

try:
    with open('d:/1/copyright_law_viewer/public/berne.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    articles = data.get('articles', [])
    found = False
    for article in articles:
        if '6bis' in article.get('number', '') or '6bis' in article.get('id', ''):
            print(f"Found Article: {article.get('number')} (ID: {article.get('id')})")
            print(f"content_expl_ko length: {len(article.get('content_expl_ko', ''))}")
            found = True

    if not found:
        print("Article 6bis not found in public/berne.json.")

except Exception as e:
    print(f"Error: {e}")
