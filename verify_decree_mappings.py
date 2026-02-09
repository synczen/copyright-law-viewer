"""
Verification script to check Decree-to-Law mappings by parsing Decree text content.
Decrees should be mapped to the Law they reference (법 제X조), not based on HTML row position.
"""
import json
import re
from html.parser import HTMLParser

class DecreeTextParser(HTMLParser):
    """Parse HTML to extract Decree IDs and their text content with Law references."""
    
    def __init__(self):
        super().__init__()
        self.in_decree_col = False
        self.in_bl_span = False
        self.current_decree_id = None
        self.current_text = ""
        self.decree_law_refs = {}  # { decree_id: law_ref }
        self.col_index = -1
        self.in_row = False
        
    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.in_row = True
            self.col_index = -1
        elif tag == 'td' and self.in_row:
            self.col_index += 1
            # Column 1 (index 1) is Decree column
            self.in_decree_col = (self.col_index == 1)
        elif tag == 'span':
            attr_dict = dict(attrs)
            if attr_dict.get('class') == 'bl':
                self.in_bl_span = True
                
    def handle_endtag(self, tag):
        if tag == 'tr':
            self.in_row = False
            self.col_index = -1
            self.in_decree_col = False
            # Process current decree if we have one
            if self.current_decree_id and self.current_text:
                # Find Law reference in text
                law_match = re.search(r'법 제(\d+(?:의\d+)?)조', self.current_text)
                if law_match:
                    law_ref = law_match.group(1)
                    self.decree_law_refs[self.current_decree_id] = law_ref
            self.current_decree_id = None
            self.current_text = ""
        elif tag == 'span':
            self.in_bl_span = False
        elif tag == 'div' and self.in_decree_col:
            # End of decree content div
            pass
            
    def handle_data(self, data):
        if self.in_decree_col:
            if self.in_bl_span:
                # Extract Decree ID from header like "제2조(복제·공연 등 내역의 제출)"
                match = re.match(r'^제(\d+(?:의\d+)?)조', data.strip())
                if match:
                    self.current_decree_id = match.group(1)
            # Collect all text for current decree
            self.current_text += data

def main():
    # Load current mappings
    with open('mappings.json', 'r', encoding='utf-8') as f:
        mappings = json.load(f)
    
    # Create Law -> Decrees lookup
    law_to_decrees = {}
    for entry in mappings:
        law_id = entry['lawId']
        for did in entry['decreeIds']:
            if did not in law_to_decrees:
                law_to_decrees[did] = []
            law_to_decrees[did].append(law_id)
    
    # Parse HTML to get Decree text-based Law references
    with open('3column.xls', 'r', encoding='utf-8') as f:
        content = f.read()
    
    parser = DecreeTextParser()
    parser.feed(content)
    
    print("=== Decree Text-Based Law References ===")
    print("These are the Laws referenced in each Decree's text (법 제X조)")
    print()
    
    mismatches = []
    
    for decree_id, text_law_ref in sorted(parser.decree_law_refs.items(), key=lambda x: float(x[0].replace('-', '.').replace('의', '.'))):
        current_laws = law_to_decrees.get(decree_id, [])
        
        # Check if text reference matches current mapping
        if text_law_ref in current_laws:
            status = "✓"
        else:
            status = "✗ MISMATCH"
            mismatches.append({
                'decree': decree_id,
                'text_ref': text_law_ref,
                'current': current_laws
            })
        
        print(f"Decree {decree_id}: Text says '법 제{text_law_ref}조' -> Currently mapped to Law(s): {current_laws} {status}")
    
    print()
    print(f"=== Summary ===")
    print(f"Total Decrees with Law references: {len(parser.decree_law_refs)}")
    print(f"Mismatches: {len(mismatches)}")
    
    if mismatches:
        print()
        print("=== MISMATCHES (Need Correction) ===")
        for m in mismatches:
            print(f"  Decree {m['decree']}: Should be Law {m['text_ref']}, currently in Law(s) {m['current']}")

if __name__ == "__main__":
    main()
