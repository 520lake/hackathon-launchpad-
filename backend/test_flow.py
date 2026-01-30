import requests
import random
import string
import time

base_url = "http://localhost:8000/api/v1"

def random_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

def get_token(email, password):
    response = requests.post(f"{base_url}/login/access-token", data={
        "username": email,
        "password": password
    })
    if response.status_code != 200:
        print(f"❌ Login failed for {email}: {response.text}")
        return None
    return response.json().get("access_token")

def register_user(email, password, name):
    print(f"Registering {email}...")
    res = requests.post(f"{base_url}/register", json={
        "email": email,
        "password": password,
        "full_name": name
    })
    if res.status_code != 200:
        print(f"❌ Register failed for {email}: {res.text}")
        return None
    return get_token(email, password)

print("--- Starting Flow Test ---")

# 1. Register Users
org_email = f"org_{random_string()}@test.com"
judge_email = f"judge_{random_string()}@test.com"
part_email = f"part_{random_string()}@test.com"
pwd = "password123"

print(f"Creating users: Org={org_email}, Judge={judge_email}, Part={part_email}")

token_org = register_user(org_email, pwd, "Organizer")
token_judge = register_user(judge_email, pwd, "Judge")
token_part = register_user(part_email, pwd, "Participant")

if not all([token_org, token_judge, token_part]):
    print("❌ Failed to register users")
    exit(1)

headers_org = {"Authorization": f"Bearer {token_org}"}
headers_judge = {"Authorization": f"Bearer {token_judge}"}
headers_part = {"Authorization": f"Bearer {token_part}"}

# 2. Create Hackathon (Org)
print("\nCreating Hackathon...")
hack_data = {
    "title": f"Hackathon {random_string()}",
    "description": "Test Hackathon",
    "start_date": "2024-01-01T00:00:00",
    "end_date": "2024-02-01T00:00:00",
    "is_online": True
}
res = requests.post(f"{base_url}/hackathons/", json=hack_data, headers=headers_org)
if res.status_code != 200:
    print(f"❌ Create Hackathon failed: {res.text}")
    exit(1)
hack_id = res.json()["id"]
print(f"✅ Hackathon created: ID {hack_id}")

# 3. Appoint Judge (Org)
print("\nAppointing Judge...")
res = requests.post(f"{base_url}/hackathons/{hack_id}/judges", params={"user_email": judge_email}, headers=headers_org)
if res.status_code != 200:
    print(f"❌ Add Judge failed: {res.text}")
    exit(1)
else:
    print("✅ Judge appointed")

# 4. Enroll (Participant)
print("\nEnrolling Participant...")
# EnrollmentCreate requires user_id and hackathon_id. 
# user_id is validated but logic uses current_user. We send 0 as placeholder.
res = requests.post(f"{base_url}/enrollments/", json={"user_id": 0, "hackathon_id": hack_id}, headers=headers_part)
if res.status_code != 200:
    print(f"❌ Enrollment failed: {res.text}")
    exit(1)
else:
    print("✅ Enrolled")

# 5. Create Team (Participant)
print("\nCreating Team...")
team_data = {
    "name": f"Team {random_string()}",
    "description": "Awesome Team",
    "looking_for": "Developers"
}
# hackathon_id is query param
res = requests.post(f"{base_url}/teams/", params={"hackathon_id": hack_id}, json=team_data, headers=headers_part)
if res.status_code != 200:
    print(f"❌ Create Team failed: {res.text}")
    exit(1)
team_id = res.json()["id"]
print(f"✅ Team created: ID {team_id}")

# 6. Submit Project (Participant/Leader)
print("\nSubmitting Project...")
project_data = {
    "title": f"Project {random_string()}",
    "description": "We built something cool",
    "demo_url": "http://demo.com",
    "repo_url": "http://github.com/repo"
}
# team_id is query param
res = requests.post(f"{base_url}/projects/", params={"team_id": team_id}, json=project_data, headers=headers_part)
if res.status_code != 200:
    print(f"❌ Submit Project failed: {res.text}")
    exit(1)
project_id = res.json()["id"]
print(f"✅ Project submitted: ID {project_id}")

# 7. Score Project (Judge)
print("\nScoring Project...")
score_data = {
    "judge_id": 0, # Ignored
    "project_id": 0, # Ignored
    "score_value": 95,
    "comment": "Excellent work!"
}
res = requests.post(f"{base_url}/projects/{project_id}/score", json=score_data, headers=headers_judge)
if res.status_code != 200:
    print(f"❌ Score Project failed: {res.text}")
    exit(1)
score_id = res.json()["id"]
print(f"✅ Project scored: ID {score_id}")

# 8. Verify Project Status and Score
print("\nVerifying Project Status...")
res = requests.get(f"{base_url}/projects/{project_id}", headers=headers_org)
if res.status_code != 200:
    print(f"❌ Get Project failed: {res.text}")
    exit(1)
project = res.json()
print(f"Project Status: {project['status']}")
print(f"Project Total Score: {project['total_score']}")

if project['status'] == 'grading' and project['total_score'] == 95.0:
    print("✅ Flow Verification SUCCESS!")
else:
    print("❌ Flow Verification FAILED: Status or Score mismatch")

print("--- End Flow Test ---")
