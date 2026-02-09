"""
Comprehensive verification script to check ALL Decree-to-Law mappings.
Parses the 3column.xls HTML file to extract Decree content and find the Law they reference.
"""
import json
import re
from html.parser import HTMLParser

class ComprehensiveParser(HTMLParser):
    """Parse HTML to extract all Decrees with their text content and find Law references."""
    
    def __init__(self):
        super().__init__()
        self.col_index = -1
        self.in_row = False
        self.in_bl_span = False
        
        # Current row data
        self.current_law_id = None
        self.current_decree_id = None
        self.current_rule_id = None
        self.current_decree_text = ""
        self.current_rule_text = ""
        
        # Collected data
        self.decree_data = []  # [{"id": X, "row_law": Y, "text_law": Z, "text": "..."}]
        self.rule_data = []    # [{"id": X, "row_law": Y, "text_decree": Z, "text": "..."}]
        
        self.last_law_id = None
        
    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.in_row = True
            self.col_index = -1
            self.current_law_id = None
            self.current_decree_id = None
            self.current_rule_id = None
            self.current_decree_text = ""
            self.current_rule_text = ""
        elif tag == 'td' and self.in_row:
            self.col_index += 1
        elif tag == 'span':
            attr_dict = dict(attrs)
            if attr_dict.get('class') == 'bl':
                self.in_bl_span = True
                
    def handle_endtag(self, tag):
        if tag == 'tr':
            # Process collected data
            if self.current_law_id:
                self.last_law_id = self.current_law_id
            
            row_law = self.current_law_id or self.last_law_id
            
            if self.current_decree_id:
                # Find Law reference in Decree text
                text_law = None
                law_match = re.search(r'법 제(\d+(?:의\d+)?)조', self.current_decree_text)
                if law_match:
                    text_law = law_match.group(1)
                
                self.decree_data.append({
                    "id": self.current_decree_id,
                    "row_law": row_law,
                    "text_law": text_law,
                    "text_preview": self.current_decree_text[:100]
                })
            
            if self.current_rule_id:
                # Find Decree reference in Rule text
                text_decree = None
                decree_match = re.search(r'영 제(\d+(?:의\d+)?)조', self.current_rule_text)
                if decree_match:
                    text_decree = decree_match.group(1)
                
                self.rule_data.append({
                    "id": self.current_rule_id,
                    "row_law": row_law,
                    "text_decree": text_decree,
                    "text_preview": self.current_rule_text[:100]
                })
            
            self.in_row = False
        elif tag == 'span':
            self.in_bl_span = False
            
    def handle_data(self, data):
        if not self.in_row:
            return
            
        data_stripped = data.strip()
        
        if self.col_index == 0:  # Law column
            if self.in_bl_span:
                match = re.match(r'^제(\d+(?:의\d+)?)조', data_stripped)
                if match:
                    self.current_law_id = match.group(1)
        elif self.col_index == 1:  # Decree column
            if self.in_bl_span:
                match = re.match(r'^제(\d+(?:의\d+)?)조', data_stripped)
                if match:
                    self.current_decree_id = match.group(1)
            self.current_decree_text += data
        elif self.col_index == 2:  # Rule column
            if self.in_bl_span:
                match = re.match(r'^제(\d+(?:의\d+)?)조', data_stripped)
                if match:
                    self.current_rule_id = match.group(1)
            self.current_rule_text += data

def main():
    # Load current mappings
    with open('mappings.json', 'r', encoding='utf-8') as f:
        mappings = json.load(f)
    
    # Create lookup: Decree -> Laws
    decree_to_laws = {}
    for entry in mappings:
        law_id = entry['lawId']
        for did in entry['decreeIds']:
            if did not in decree_to_laws:
                decree_to_laws[did] = []
            if law_id not in decree_to_laws[did]:
                decree_to_laws[did].append(law_id)
    
    # Parse HTML
    with open('3column.xls', 'r', encoding='utf-8') as f:
        content = f.read()
    
    parser = ComprehensiveParser()
    parser.feed(content)
    
    print("=" * 80)
    print("DECREE MAPPING VERIFICATION")
    print("=" * 80)
    
    mismatches = []
    
    for d in parser.decree_data:
        decree_id = d['id']
        row_law = d['row_law']
        text_law = d['text_law']
        current_laws = decree_to_laws.get(decree_id, [])
        
        # Check if there's a mismatch
        if text_law and text_law not in current_laws:
            mismatches.append({
                'type': 'decree',
                'id': decree_id,
                'should_be': text_law,
                'currently': current_laws,
                'row_law': row_law
            })
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total Decrees parsed: {len(parser.decree_data)}")
    print(f"Mismatches found: {len(mismatches)}")
    
    if mismatches:
        print()
        print("MISMATCHES REQUIRING CORRECTION:")
        for m in mismatches:
            print(f"  Decree {m['id']}: Should be in Law {m['should_be']}, currently in {m['currently']} (row was Law {m['row_law']})")
        
        # Save to JSON for analysis
        with open('mismatches.json', 'w', encoding='utf-8') as f:
            json.dump(mismatches, f, ensure_ascii=False, indent=2)
        print()
        print("Mismatches saved to mismatches.json")

if __name__ == "__main__":
    main()
