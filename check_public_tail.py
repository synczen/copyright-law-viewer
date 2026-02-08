
file_path = r'd:\1\copyright_law_viewer\public\berne.json'

with open(file_path, 'rb') as f:
    f.seek(0, 2)
    size = f.tell()
    print(f"File size: {size}")
    if size > 500:
        f.seek(size - 500)
    else:
        f.seek(0)
    tail = f.read()
    try:
        print(f"Tail text: {tail.decode('utf-8', errors='replace')}")
    except Exception as e:
        print(e)
