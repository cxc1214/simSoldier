import requests
import sys

BASE_URL = "http://localhost:8000"

def run_tests():
    print("Running verification tests...")

    # 1. Login
    print("\n1. Testing Login...")
    login_data = {
        "username": "testuser",
        "password": "password123"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/login", data=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return False
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            print("No access token returned")
            return False
        print("Login success. Token received.")
    except Exception as e:
        print(f"Login exception: {e}")
        return False

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # 2. Get User Info
    print("\n2. Testing Get User Info...")
    try:
        response = requests.get(f"{BASE_URL}/api/user_info", headers=headers)
        if response.status_code != 200:
            print(f"Get User Info failed: {response.text}")
            return False
        user_info = response.json()
        print(f"User Info: {user_info}")
        if user_info.get("username") != "testuser":
            print("Incorrect user info returned")
            return False
        # Optional: show new fields if present
        print(f"role: {user_info.get('role')}, height: {user_info.get('height')}, weight: {user_info.get('weight')}")
    except Exception as e:
        print(f"Get info exception: {e}")
        return False

    # 3. Edit User
    print("\n3. Testing Edit User...")
    edit_data = {
        "gender": "Helicopter",
        "date_of_birth": "1999-12-31",
        "role": 1,
        "height": 180,
        "weight": 75,
        "entrance_date": "2022-09-01",
        "do_have_chronic_medications":True
        }
    try:
        response = requests.post(f"{BASE_URL}/api/user_edit", json=edit_data, headers=headers)
        if response.status_code != 200:
            print(f"Edit User failed: {response.text}")
            return False
        updated_user = response.json()
        print(f"Updated User: {updated_user}")
        if updated_user.get("role") != 1:
            print("Role not updated")
            return False
        if updated_user.get("height") != 180:
            print("Height not updated")
            return False
        if updated_user.get("weight") != 75:
            print("Weight not updated")
            return False
        
        
    except Exception as e:
        print(f"Edit exception: {e}")
        return False
    # 5 chat    
    print("\n5. Testing Chat...")
    try:
        response = requests.post(f"{BASE_URL}/api/chat", headers=headers, json={"question": "How many days of PTO do employees get?"})
        if response.status_code != 200:
            print(f"Chat failed: {response.text}")
            return False
        print(f"Chat response: {response.text}")
    except Exception as e:
        print(f"Chat exception: {e}")
        return False
        
    # 4. Logout (Client side really, but checking endpoint)
    print("\n4. Testing Logout...")
    try:
        response = requests.post(f"{BASE_URL}/api/logout", headers=headers)
        if response.status_code != 200:
            print(f"Logout failed: {response.text}")
            return False
        print(f"Logout response: {response.text}")
    except Exception as e:
        print(f"Logout exception: {e}")
        return False

    print("\nAll tests passed!")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
