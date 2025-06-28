#!/usr/bin/env python3
"""
Script to remove all Supabase references from the backend
"""
import os
import re
import shutil
from pathlib import Path

def find_supabase_references(directory):
    """Find all files with Supabase references"""
    references = []
    supabase_patterns = [
        r'supabase',
        r'@supabase',
        r'SUPABASE_',
        r'\.from\(',  # Supabase query pattern
        r'\.rpc\(',   # Supabase RPC pattern
        r'\.auth\.',  # Supabase auth pattern
    ]
    
    for root, dirs, files in os.walk(directory):
        # Skip certain directories
        skip_dirs = {'.git', '__pycache__', '.venv', 'node_modules', '.pytest_cache'}
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            if file.endswith(('.py', '.js', '.ts', '.json', '.md', '.yaml', '.yml')):
                filepath = Path(root) / file
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        
                    for pattern in supabase_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            references.append(str(filepath))
                            break
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")
    
    return references

def remove_supabase_imports(directory):
    """Remove Supabase imports from Python files"""
    python_files = []
    for root, dirs, files in os.walk(directory):
        skip_dirs = {'.git', '__pycache__', '.venv', 'migrations'}
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            if file.endswith('.py'):
                python_files.append(Path(root) / file)
    
    for filepath in python_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Remove Supabase-related imports
            filtered_lines = []
            for line in lines:
                if not re.search(r'(import.*supabase|from.*supabase)', line, re.IGNORECASE):
                    filtered_lines.append(line)
                else:
                    print(f"Removing Supabase import from {filepath}: {line.strip()}")
            
            # Write back if changes were made
            if len(filtered_lines) != len(lines):
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(filtered_lines)
                print(f"Updated {filepath}")
                
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

def update_requirements():
    """Remove Supabase from requirements.txt"""
    req_file = Path("requirements.txt")
    if req_file.exists():
        try:
            with open(req_file, 'r') as f:
                lines = f.readlines()
            
            filtered_lines = [
                line for line in lines 
                if not re.search(r'supabase', line, re.IGNORECASE)
            ]
            
            if len(filtered_lines) != len(lines):
                with open(req_file, 'w') as f:
                    f.writelines(filtered_lines)
                print("Updated requirements.txt")
                
        except Exception as e:
            print(f"Error updating requirements.txt: {e}")

def create_backup():
    """Create backup of current state"""
    backup_dir = Path("backup_before_supabase_removal")
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    
    # Backup critical files
    critical_files = [
        "main.py",
        "models.py", 
        "requirements.txt",
        "src/",
        "routes/"
    ]
    
    backup_dir.mkdir()
    for item in critical_files:
        item_path = Path(item)
        if item_path.exists():
            if item_path.is_file():
                shutil.copy2(item_path, backup_dir / item_path.name)
            else:
                shutil.copytree(item_path, backup_dir / item_path.name)
    
    print(f"Backup created at {backup_dir}")

def main():
    """Main cleanup function"""
    print("Starting Supabase cleanup...")
    
    # Create backup first
    create_backup()
    
    # Find all references
    backend_dir = Path(".")
    references = find_supabase_references(backend_dir)
    
    print(f"\nFound Supabase references in {len(references)} files:")
    for ref in references:
        print(f"  - {ref}")
    
    # Ask for confirmation
    response = input(f"\nProceed with cleanup? This will modify {len(references)} files. (y/N): ")
    if response.lower() != 'y':
        print("Cleanup cancelled.")
        return
    
    # Remove imports
    print("\nRemoving Supabase imports...")
    remove_supabase_imports(backend_dir)
    
    # Update requirements
    print("\nUpdating requirements.txt...")
    update_requirements()
    
    # Final report
    print("\n" + "="*50)
    print("SUPABASE CLEANUP COMPLETED")
    print("="*50)
    print("\nNext steps:")
    print("1. Review the changes manually")
    print("2. Run tests to ensure nothing is broken")
    print("3. Update any remaining references manually")
    print("4. Run: pip install -r requirements.txt")
    print("5. Run: alembic upgrade head")
    print("\nBackup available at: backup_before_supabase_removal/")

if __name__ == "__main__":
    main()