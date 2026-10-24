import os
import zipfile

def make_project_zip(output_path):
    exclude_dirs = {'node_modules', 'dist', '.playwright-cli', '.git', '__pycache__', '.cache', '.aistudio'}
    exclude_files = {'.DS_Store', '.env'}

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files or file.endswith('.zip'):
                    continue
                file_path = os.path.join(root, file)
                # Relative archive name
                arcname = os.path.relpath(file_path, '.')
                zipf.write(file_path, arcname)
                print(f"Added: {arcname}")

    print(f"\nSuccessfully created clean project zip at: {output_path}")

if __name__ == '__main__':
    make_project_zip('public/auranotes-pro.zip')
    import shutil
    shutil.copyfile('public/auranotes-pro.zip', 'public/nexora-notes-pro.zip')
