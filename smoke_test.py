import requests
import time
import random
import sys

BASE_URL = "http://localhost:8082"

def main():
    print("=== STARTING PISTOS INTEGRATION SMOKE TEST ===")
    ts = int(time.time())
    random_digits = "".join([str(random.randint(0, 9)) for _ in range(6)])
    email = f"integration_test_{ts}@example.com"
    phone = f"08129{random_digits}"
    password = "Member123!"
    name = "Integration Test User"

    # 1. Register member
    print("\n[Step 1] Registering a new member...")
    register_payload = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": password
    }
    r = requests.post(f"{BASE_URL}/api/v1/auth/register", json=register_payload)
    if r.status_code != 210 and r.status_code != 201:
        print(f"FAILED to register member: {r.status_code} - {r.text}")
        sys.exit(1)
    
    register_data = r.json()
    member_id = register_data["user"]["id"]
    print(f"SUCCESS: Registered member with ID: {member_id}")

    # 2. Login member
    print("\n[Step 2] Logging in as the new member...")
    login_payload = {
        "email": email,
        "password": password
    }
    r = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_payload)
    assert r.status_code == 200, f"Failed to login: {r.text}"
    member_token = r.json()["token"]
    print("SUCCESS: Logged in and retrieved token")

    member_headers = {"Authorization": f"Bearer {member_token}"}

    # 3. Check initial point balances
    print("\n[Step 3] Verifying initial point balances are zero...")
    r = requests.get(f"{BASE_URL}/api/v1/members/{member_id}/points", headers=member_headers)
    assert r.status_code == 200, f"Failed to get points: {r.text}"
    points_data = r.json()
    for balance in points_data["balances"]:
        print(f"Partner {balance['partnerName']}: {balance['balance']} pts")
        assert balance["balance"] == 0, f"Expected 0 balance, got {balance['balance']}"
    print("SUCCESS: All initial balances are zero")

    # 4. Get partner token (KFC)
    print("\n[Step 4] Requesting partner API token for KFC...")
    partner_auth_payload = {
        "partnerId": "660e8400-e29b-41d4-a716-446655440001",
        "apiKey": "kfc_api_key_2026_secure_demo_only"
    }
    r = requests.post(f"{BASE_URL}/api/v1/auth/partner/token", json=partner_auth_payload)
    assert r.status_code == 200, f"Failed to get partner token: {r.text}"
    partner_token = r.json()["token"]
    print("SUCCESS: Retrieved partner token")

    partner_headers = {"Authorization": f"Bearer {partner_token}"}

    # 5. Earn points (1,000,000 IDR -> 1,000 KFC points)
    print("\n[Step 5] Injecting transactions to earn points...")
    earn_payload = {
        "memberIdentifier": email,
        "partner": "KFC",
        "trxAmount": 1000000
    }
    r = requests.post(f"{BASE_URL}/api/v1/transactions", json=earn_payload, headers=partner_headers)
    assert r.status_code == 201, f"Failed to earn points: {r.text}"
    print(f"SUCCESS: Earned {r.json()['pointsEarned']} points")

    # 6. Verify updated points balance
    print("\n[Step 6] Verifying updated KFC points balance...")
    r = requests.get(f"{BASE_URL}/api/v1/members/{member_id}/points", headers=member_headers)
    assert r.status_code == 200, f"Failed to get points: {r.text}"
    balances = {b["partnerName"]: b["balance"] for b in r.json()["balances"]}
    print(f"Current balances: {balances}")
    assert balances.get("KFC Indonesia") == 1000, f"Expected KFC balance to be 1000, got {balances.get('KFC Indonesia')}"
    print("SUCCESS: KFC points successfully credited")

    # 7. Exchange points (500 KFC points -> MCD points)
    print("\n[Step 7] Exchanging KFC points to MCD points...")
    exchange_payload = {
        "fromPartnerId": "660e8400-e29b-41d4-a716-446655440001", # KFC
        "toPartnerId": "660e8400-e29b-41d4-a716-446655440002", # MCD
        "points": 500
    }
    r = requests.post(f"{BASE_URL}/api/v1/exchange", json=exchange_payload, headers=member_headers)
    assert r.status_code == 200, f"Failed to exchange points: {r.text}"
    exchange_res = r.json()
    print(f"SUCCESS: Exchanged {exchange_res['pointsDeducted']} KFC points for {exchange_res['pointsCredited']} MCD points")
    assert exchange_res["pointsDeducted"] == 500
    assert exchange_res["pointsCredited"] == 400 # 500 * 0.8 = 400

    # Verify balances after exchange
    r = requests.get(f"{BASE_URL}/api/v1/members/{member_id}/points", headers=member_headers)
    balances = {b["partnerName"]: b["balance"] for b in r.json()["balances"]}
    print(f"Balances after exchange: {balances}")
    assert balances.get("KFC Indonesia") == 500
    assert balances.get("McDonald's Indonesia") == 400

    # 8. Redeem MCD points for reward
    print("\n[Step 8] Redeeming MCD points for McDonald's reward...")
    redeem_payload = {
        "rewardId": "880e8400-e29b-41d4-a716-446655440007" # McNuggets 6pcs (cost 200)
    }
    r = requests.post(f"{BASE_URL}/api/v1/redeem", json=redeem_payload, headers=member_headers)
    assert r.status_code == 200, f"Failed to redeem reward: {r.text}"
    redeem_res = r.json()
    print(f"SUCCESS: Redeemed reward. Deducted {redeem_res['pointsDeducted']} points")
    assert redeem_res["pointsDeducted"] == 200

    # Verify balances after redemption
    r = requests.get(f"{BASE_URL}/api/v1/members/{member_id}/points", headers=member_headers)
    balances = {b["partnerName"]: b["balance"] for b in r.json()["balances"]}
    print(f"Balances after redeem: {balances}")
    assert balances.get("McDonald's Indonesia") == 200

    # 9. Verify transaction history
    print("\n[Step 9] Checking member transaction history...")
    r = requests.get(f"{BASE_URL}/api/v1/members/{member_id}/transactions", headers=member_headers)
    assert r.status_code == 200, f"Failed to get transaction history: {r.text}"
    transactions = r.json()["transactions"]
    types = [tx["type"] for tx in transactions]
    print(f"Transaction types in history: {types}")
    assert "EARN" in types
    assert "EXCHANGE_OUT" in types
    assert "EXCHANGE_IN" in types
    assert "REDEEM" in types
    print("SUCCESS: Transaction history shows all types correctly")

    # 10. Login admin
    print("\n[Step 10] Logging in as Admin...")
    admin_payload = {
        "email": "admin@jdt17loyalty.com",
        "password": "Admin123!"
    }
    r = requests.post(f"{BASE_URL}/api/v1/auth/login", json=admin_payload)
    assert r.status_code == 200, f"Failed to login admin: {r.text}"
    admin_token = r.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("SUCCESS: Admin logged in")

    # 11. Deactivate member
    print("\n[Step 11] Deactivating member as admin...")
    deactivate_payload = {
        "name": name,
        "phone": phone,
        "status": "INACTIVE"
    }
    r = requests.put(f"{BASE_URL}/api/v1/members/{member_id}", json=deactivate_payload, headers=admin_headers)
    assert r.status_code == 200, f"Failed to deactivate member: {r.text}"
    assert r.json()["status"] == "INACTIVE"
    print("SUCCESS: Member status is now INACTIVE")

    # 12. Attempt to earn points for inactive member
    print("\n[Step 12] Attempting to earn points for inactive member (should fail)...")
    r = requests.post(f"{BASE_URL}/api/v1/transactions", json=earn_payload, headers=partner_headers)
    print(f"Response status: {r.status_code}")
    assert r.status_code == 400, f"Expected 400 Bad Request, got {r.status_code}"
    error_code = r.json().get("code")
    print(f"Error code returned: {error_code}")
    assert error_code == "MEMBER_INACTIVE", f"Expected error code MEMBER_INACTIVE, got {error_code}"
    print("SUCCESS: Rejected as expected")

    # 13. Reactivate member
    print("\n[Step 13] Reactivating member as admin...")
    reactivate_payload = {
        "name": name,
        "phone": phone,
        "status": "ACTIVE"
    }
    r = requests.put(f"{BASE_URL}/api/v1/members/{member_id}", json=reactivate_payload, headers=admin_headers)
    assert r.status_code == 200, f"Failed to reactivate member: {r.text}"
    assert r.json()["status"] == "ACTIVE"
    print("SUCCESS: Member reactivated successfully")

    print("\n=== ALL INTEGRATION SMOKE TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()
