import win32com.client
import os

def extract_text_from_doc_with_word(file_path, output_path):
    """Use Microsoft Word COM to extract text from .doc files"""
    try:
        # Get absolute path
        abs_path = os.path.abspath(file_path)
        print(f"Reading: {abs_path}")
        
        # Open Word application
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        
        # Open document
        doc = word.Documents.Open(abs_path)
        
        # Get all text
        text = doc.Range().Text
        
        # Close document and quit Word
        doc.Close(False)
        word.Quit()
        
        # Save to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"  -> Saved to {output_path} ({len(text)} characters)")
        return True
        
    except Exception as e:
        print(f"  -> Error: {e}")
        return False

# Process all documents
base_dir = r"D:\1\copyright_law_viewer"
files = [
    ('저작권법.doc', 'copyright_law.txt'),
    ('저작권법 시행령.doc', 'copyright_decree.txt'),
    ('저작권법 시행규칙.doc', 'copyright_rule.txt')
]

for doc_file, txt_file in files:
    doc_path = os.path.join(base_dir, doc_file)
    txt_path = os.path.join(base_dir, txt_file)
    
    if os.path.exists(doc_path):
        print(f"\nProcessing: {doc_file}")
        extract_text_from_doc_with_word(doc_path, txt_path)
    else:
        print(f"File not found: {doc_path}")

print("\nDone!")
