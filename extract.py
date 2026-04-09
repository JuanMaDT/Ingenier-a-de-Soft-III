import sys
try:
    from pypdf import PdfReader
    reader = PdfReader('Entrega 1 - Documento Vision y Alcance (2).pdf')
    with open('pdf_text.txt', 'w', encoding='utf-8') as f:
        for page in reader.pages:
            text = page.extract_text()
            if text:
                f.write(text + '\n')
    print("Extraction successful")
except Exception as e:
    print(f"Error: {e}")
