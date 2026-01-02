import os
import json
import fitz

ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(ROOT, 'data')
PROCESSED_DIR = os.path.join(ROOT, 'data', 'processed')

os.makedirs(PROCESSED_DIR, exist_ok=True)

def extract_pdf(path):
    doc = fitz.open(path)
    pages = []
    for i in range(doc.page_count):
        page = doc.load_page(i)
        text = page.get_text().strip()
        pages.append({'page_number': i+1, 'content': text, 'type': 'pdf'})
    return pages

def make_safe_name(s):
    return ''.join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in s).replace(' ', '_')

def main():
    if not os.path.exists(DATA_DIR):
        print('No data directory found at', DATA_DIR)
        return

    count = 0
    for class_dir in sorted(os.listdir(DATA_DIR)):
        class_path = os.path.join(DATA_DIR, class_dir)
        if not os.path.isdir(class_path) or not class_dir.startswith('class'):
            continue
        grade = class_dir.replace('class', '')
        for root, _, files in os.walk(class_path):
            for f in files:
                if not f.lower().endswith('.pdf'):
                    continue
                full = os.path.join(root, f)
                rel = os.path.relpath(full, DATA_DIR)
                subject = os.path.basename(os.path.dirname(full))
                safe_name = make_safe_name(f.replace('.pdf',''))
                out_name = f"{grade}_{subject}_{safe_name}.json"
                out_path = os.path.join(PROCESSED_DIR, out_name)
                if os.path.exists(out_path):
                    print('Skipping (exists):', out_name)
                    continue
                try:
                    pages = extract_pdf(full)
                    data = {
                        'metadata': {
                            'title': os.path.splitext(f)[0],
                            'filename': f,
                            'subject': subject,
                            'grade': grade,
                            'source_path': rel
                        },
                        'pages': pages
                    }
                    with open(out_path, 'w', encoding='utf-8') as fh:
                        json.dump(data, fh, ensure_ascii=False, indent=2)
                    count += 1
                    print('Processed:', out_name)
                except Exception as e:
                    print('Error processing', full, e)

    print(f'Done. Processed {count} files into {PROCESSED_DIR}')

if __name__ == '__main__':
    main()
