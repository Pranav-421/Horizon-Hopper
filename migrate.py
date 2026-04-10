import os
import shutil
import re

ROOT = r"c:\Users\pgupt\OneDrive\Desktop\Version 2\horizon-hopper-fixed"
BACKEND = os.path.join(ROOT, "backend")
APP = os.path.join(BACKEND, "app")

def setup_dirs():
    dirs = [
        os.path.join(ROOT, "legacy_streamlit"),
        os.path.join(ROOT, "backend", "tests"),
        os.path.join(APP, "api"),
        os.path.join(APP, "core"),
        os.path.join(APP, "services"),
        os.path.join(APP, "models"),
        os.path.join(APP, "agents"),
        os.path.join(APP, "utils"),
        os.path.join(BACKEND, "data"),
        os.path.join(BACKEND, "memory"),
        os.path.join(BACKEND, "diagrams"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        init_file = os.path.join(d, "__init__.py")
        if "legacy_streamlit" not in d and "data" not in d and "memory" not in d and "diagrams" not in d and "tests" not in d:
            if not os.path.exists(init_file):
                with open(init_file, "w") as f:
                    pass
    # App root init
    if not os.path.exists(os.path.join(APP, "__init__.py")):
        with open(os.path.join(APP, "__init__.py"), "w") as f:
            pass

def safe_move(src, dest):
    src_path = os.path.join(ROOT, src)
    dest_path = os.path.join(ROOT, dest)
    if os.path.exists(src_path):
        if os.path.exists(dest_path):
            if os.path.isdir(src_path):
                for item in os.listdir(src_path):
                    # Remove existing item in dest_path if we are overwriting it (like empty __init__.py)
                    d_item = os.path.join(dest_path, item)
                    if os.path.exists(d_item):
                        if os.path.isfile(d_item) and os.path.getsize(d_item) == 0:
                            os.remove(d_item)
                    shutil.move(os.path.join(src_path, item), dest_path)
                shutil.rmtree(src_path)
            else:
                shutil.move(src_path, dest_path)
        else:
            shutil.move(src_path, dest_path)
    else:
        print(f"Warning: {src_path} not found")

def execute_moves():
    # 1. Streamlit app
    safe_move("app.py", "legacy_streamlit/app.py")
    
    # 2. Config & Orchestrator
    safe_move("config.py", "backend/app/core/config.py")
    safe_move("orchestrator.py", "backend/app/services/orchestrator.py")
    
    # 3. Backend files
    safe_move("backend/service.py", "backend/app/services/service.py")
    safe_move("backend/schemas.py", "backend/app/models/schemas.py")
    safe_move("backend/app.py", "backend/app/main.py")
    if os.path.exists(os.path.join(ROOT, "backend", "__init__.py")):
        os.remove(os.path.join(ROOT, "backend", "__init__.py"))
    
    # 4. Folders
    safe_move("agents", "backend/app/agents")
    safe_move("tools", "backend/app/utils")
    safe_move("data", "backend/data")
    safe_move("memory", "backend/memory")
    safe_move("diagrams", "backend/diagrams")
    
    # 5. Delete bad folder if exists -> {agents,tools,data,memory,diagrams}
    bad_dir = os.path.join(ROOT, "{agents,tools,data,memory,diagrams}")
    if os.path.exists(bad_dir):
        shutil.rmtree(bad_dir)
        
    safe_move("test_agents.py", "backend/tests/test_agents.py")

def update_imports():
    patterns = [
        (re.compile(r"^from agents(?=\.| )", re.MULTILINE), r"from app.agents"),
        (re.compile(r"^import agents(?=\.| )", re.MULTILINE), r"import app.agents"),
        (re.compile(r"from agents\.", re.MULTILINE), r"from app.agents."),
        (re.compile(r"from tools\.", re.MULTILINE), r"from app.utils."),
        
        (re.compile(r"^from tools(?=\.| )", re.MULTILINE), r"from app.utils"),
        (re.compile(r"^import tools(?=\.| )", re.MULTILINE), r"import app.utils"),
        
        (re.compile(r"^from backend\.service", re.MULTILINE), r"from app.services.service"),
        (re.compile(r"^from backend\.schemas", re.MULTILINE), r"from app.models.schemas"),
        
        (re.compile(r"^from config import", re.MULTILINE), r"from app.core.config import"),
        (re.compile(r"^import config$", re.MULTILINE), r"from app.core import config"),
        
        (re.compile(r"^from orchestrator import", re.MULTILINE), r"from app.services.orchestrator import"),
        (re.compile(r"^import orchestrator$", re.MULTILINE), r"from app.services import orchestrator"),
    ]

    for root, dirs, files in os.walk(ROOT):
        if "node_modules" in root or ".venv" in root or "venv" in root:
            continue
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content
                for pat, repl in patterns:
                    new_content = pat.sub(repl, new_content)
                
                if content != new_content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                        print(f"Updated imports in {path}")

if __name__ == "__main__":
    setup_dirs()
    execute_moves()
    update_imports()
    print("Migration complete!")
