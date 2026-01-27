"""
Simple API test script for OpenScans Python Backend

Run this after starting the server to verify all endpoints work
"""
import requests
import json
import sys


BASE_URL = "http://localhost:8000"


def test_health():
    """Test health check endpoint"""
    print("\n" + "="*60)
    print("Testing: GET /api/health")
    print("="*60)

    try:
        response = requests.get(f"{BASE_URL}/api/health")
        response.raise_for_status()

        data = response.json()
        print(f"✓ Status: {data['status']}")
        print(f"✓ Version: {data['version']}")
        print(f"✓ Device: {data['device']}")
        print(f"✓ CUDA Available: {data['cuda_available']}")
        print(f"✓ Python: {data['python_version']}")

        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_model_status():
    """Test model status endpoint"""
    print("\n" + "="*60)
    print("Testing: GET /api/models/status?task=vertebrae")
    print("="*60)

    try:
        response = requests.get(f"{BASE_URL}/api/models/status", params={"task": "vertebrae"})
        response.raise_for_status()

        data = response.json()
        print(f"✓ Task: {data['task']}")
        print(f"✓ Name: {data['name']}")
        print(f"✓ Downloaded: {data['downloaded']}")
        print(f"✓ Size: {data['size_mb']} MB")
        print(f"✓ Cache Path: {data['cache_path']}")

        if not data['downloaded']:
            print("\n⚠ Models not yet downloaded. They will download on first inference.")

        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_all_models():
    """Test all models status endpoint"""
    print("\n" + "="*60)
    print("Testing: GET /api/models/all")
    print("="*60)

    try:
        response = requests.get(f"{BASE_URL}/api/models/all")
        response.raise_for_status()

        data = response.json()
        for task, info in data.items():
            print(f"\n{task.upper()}:")
            print(f"  Name: {info['name']}")
            print(f"  Downloaded: {info['downloaded']}")
            print(f"  Size: {info['size_mb']} MB")

        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_cache_stats():
    """Test cache stats endpoint"""
    print("\n" + "="*60)
    print("Testing: GET /api/models/cache-stats")
    print("="*60)

    try:
        response = requests.get(f"{BASE_URL}/api/models/cache-stats")
        response.raise_for_status()

        data = response.json()
        print(f"✓ Cache Directory: {data['cache_directory']}")
        print(f"✓ Total Size: {data['total_size_mb']} MB")
        print(f"✓ File Count: {data['file_count']}")

        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_detect_vertebrae(dicom_path: str = None):
    """Test vertebrae detection endpoint"""
    print("\n" + "="*60)
    print("Testing: POST /api/detect-vertebrae")
    print("="*60)

    if not dicom_path:
        print("⚠ Skipping: No DICOM file path provided")
        print("  Usage: python test_api.py /path/to/dicom/file.dcm")
        return True

    try:
        payload = {
            "file_path": dicom_path,
            "fast_mode": True
        }

        print(f"Detecting vertebrae in: {dicom_path}")
        print("This may take 5-30 seconds on first run (downloading models)...")

        response = requests.post(
            f"{BASE_URL}/api/detect-vertebrae",
            json=payload,
            timeout=300  # 5 minutes timeout for first download
        )
        response.raise_for_status()

        data = response.json()

        if data['success']:
            print(f"\n✓ Success!")
            print(f"✓ Found {len(data['vertebrae'])} vertebrae")
            print(f"✓ Processing Time: {data['processing_time_ms']} ms")
            print(f"✓ Device: {data['device']}")

            print("\nDetected vertebrae:")
            for vertebra in data['vertebrae']:
                print(f"  {vertebra['label']}: "
                      f"({vertebra['center']['x']}, {vertebra['center']['y']}) "
                      f"confidence={vertebra['confidence']}")
        else:
            print(f"\n✗ Failed: {data.get('error', 'Unknown error')}")

        return data['success']

    except requests.exceptions.Timeout:
        print("✗ Request timed out. Model download may be in progress.")
        print("  Try again in a few minutes.")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("OpenScans Python Backend - API Tests")
    print("="*60)
    print(f"Base URL: {BASE_URL}")

    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/", timeout=2)
    except:
        print("\n✗ Server is not running!")
        print("  Start it with: python main.py")
        sys.exit(1)

    # Run tests
    results = []

    results.append(("Health Check", test_health()))
    results.append(("Model Status", test_model_status()))
    results.append(("All Models", test_all_models()))
    results.append(("Cache Stats", test_cache_stats()))

    # Optional: Test detection if DICOM path provided
    if len(sys.argv) > 1:
        dicom_path = sys.argv[1]
        results.append(("Vertebrae Detection", test_detect_vertebrae(dicom_path)))

    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)

    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status} - {test_name}")

    total = len(results)
    passed = sum(1 for _, p in results if p)

    print(f"\nPassed: {passed}/{total}")

    if passed == total:
        print("\n✓ All tests passed!")
        sys.exit(0)
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
