import win32com.client
import os

def extract_pdf_with_word(pdf_path, output_path):
    try:
        abs_pdf_path = os.path.abspath(pdf_path)
        abs_output_path = os.path.abspath(output_path)
        print(f"Opening: {abs_pdf_path}")
        
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        
        # Open PDF (Word will convert it)
        doc = word.Documents.Open(abs_pdf_path, ConfirmConversions=False)
        
        # Get text
        text = doc.Range().Text
        
        # Save to file
        with open(abs_output_path, 'w', encoding='utf-8') as f:
            f.write(text)
            
        doc.Close(False)
        word.Quit()
        
        print(f"Success! Saved to {abs_output_path}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    pdf_path = r"d:\1\wipo_berne\guidetotheBern.pdf"
    output_path = r"d:\1\wipo_berne\berne_text.txt"
    extract_pdf_with_word(pdf_path, output_path)
