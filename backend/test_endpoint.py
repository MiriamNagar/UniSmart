"""
Quick test script to verify the /courses endpoint returns data correctly.

This script tests the backend API endpoints to ensure they are working properly.
It can be used for development and debugging purposes.

Usage:
    python test_endpoint.py

Prerequisites:
    - Backend server must be running on http://localhost:8080
    - requests library must be installed

Author: UniSmart Development Team
"""
import requests
import json

def test_courses_endpoint():
    base_url = "http://localhost:8080"
    
    print("Testing /courses endpoint...")
    print(f"Base URL: {base_url}")
    
    try:
        # Test health endpoint first
        print("\n1. Testing /health endpoint...")
        health_response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Status: {health_response.status_code}")
        print(f"   Response: {health_response.json()}")
        
        # Test courses endpoint
        print("\n2. Testing /courses?semester=A endpoint...")
        courses_response = requests.get(f"{base_url}/courses?semester=A", timeout=5)
        print(f"   Status: {courses_response.status_code}")
        
        data = courses_response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        
        if data.get("courses"):
            print(f"\n✓ Success! Found {len(data['courses'])} courses:")
            for course in data["courses"]:
                print(f"   - {course['id']}: {course['name']}")
        else:
            print("\n✗ No courses found in response!")
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Connection error: Backend server is not running!")
        print("   Start it with: python main.py")
    except requests.exceptions.Timeout:
        print("\n✗ Timeout: Backend server took too long to respond")
    except Exception as e:
        print(f"\n✗ Error: {e}")

if __name__ == "__main__":
    test_courses_endpoint()

