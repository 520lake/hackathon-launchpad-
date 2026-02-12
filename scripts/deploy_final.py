from modelscope.hub.api import HubApi
import os
import subprocess
import shutil

# Define the model ID and local directory
model_id = 'SULAKE666/Aura'
local_dir = r'D:\downlaod\hackthon\make'
temp_clone_dir = os.path.join(local_dir, '.deploy_temp_clone')

# ModelScope Git URL with token
modelscope_git_url = 'https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aura.git'

print(f"Attempting to deploy project '{model_id}' from '{local_dir}' to ModelScope using git...")

try:
    # 1. Clean up previous clone if it exists
    if os.path.exists(temp_clone_dir):
        print(f"Removing existing temporary clone directory: {temp_clone_dir}")
        shutil.rmtree(temp_clone_dir)

    # 2. Clone the ModelScope repository
    print(f"Cloning {modelscope_git_url} into {temp_clone_dir}...")
    subprocess.run(['git', 'clone', modelscope_git_url, temp_clone_dir], check=True)

    # 3. Copy project files into the cloned repository
    print(f"Copying project files from {local_dir} to {temp_clone_dir}...")
    for item in os.listdir(local_dir):
        s = os.path.join(local_dir, item)
        d = os.path.join(temp_clone_dir, item)
        
        # Exclude directories
        if item in ['.git', '.modelscope_clone', '.deploy_temp_clone', '__pycache__', '.venv', 'deploy_bundle', 'node_modules', 'dist']:
            continue
            
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)

    # 4. Change directory to the cloned repository
    os.chdir(temp_clone_dir)

    # 5. Configure git user (required for commit)
    subprocess.run(['git', 'config', 'user.email', 'trae_ide@example.com'], check=True)
    subprocess.run(['git', 'config', 'user.name', 'Trae IDE'], check=True)

    # 6. Add all changes, commit, and push
    print("Adding changes to git...")
    subprocess.run(['git', 'add', '.'], check=True)

    # Check if there are any changes to commit
    status = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
    if not status.stdout.strip():
        print("No changes to commit.")
    else:
        print("Committing changes...")
        commit_message = "Auto-deploy from Trae IDE: Aura Platform v2.8.4 (WhitePaper Sync & Build Fix)"
        subprocess.run(['git', 'commit', '-m', commit_message], check=True)

        print("Pushing changes to ModelScope...")
        subprocess.run(['git', 'push', 'origin', 'master'], check=True)
        print(f"Successfully deployed project '{model_id}' to ModelScope.")

except subprocess.CalledProcessError as e:
    print(f"Git command failed: {e}")
except Exception as e:
    print(f"Error deploying project to ModelScope: {e}")
finally:
    # 7. Clean up: Remove the temporary clone directory
    if os.path.exists(temp_clone_dir):
        print(f"Cleaning up temporary clone directory: {temp_clone_dir}")
        # shutil.rmtree(temp_clone_dir) # Keep it for debugging if needed, or uncomment to clean
    # Change back to original directory
    os.chdir(local_dir)
