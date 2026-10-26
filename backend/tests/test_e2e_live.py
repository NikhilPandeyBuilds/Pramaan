import httpx

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_live_journey():
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"
        print("[PASS] Health check endpoint verified")

        # 2. Login as Officer
        login_res = client.post("/auth/login", json={
            "email": "officer@aicte.gov.in",
            "password": "OfficerPass123!"
        })
        assert login_res.status_code == 200
        token_data = login_res.json()
        token = token_data["access_token"]
        assert token_data["user"]["role"] == "REGULATORY_OFFICER"
        print("[PASS] Officer login and JWT generation verified")

        headers = {"Authorization": f"Bearer {token}"}

        # 3. Dashboard summary
        dash_res = client.get("/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200
        dash = dash_res.json()
        assert dash["total_applications"] >= 9
        print(f"[PASS] Dashboard metrics verified ({dash['total_applications']} total applications)")

        # 4. List Applications
        apps_res = client.get("/applications", headers=headers)
        assert apps_res.status_code == 200
        apps = apps_res.json()
        assert len(apps) >= 9
        first_app = apps[0]
        app_id = first_app["id"]
        print(f"[PASS] Applications list verified ({len(apps)} applications)")

        # 5. Application Detail
        detail_res = client.get(f"/applications/{app_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert "documents" in detail
        assert "findings" in detail
        print("[PASS] Application detail dossier verified")

        # 6. Run Validation
        val_res = client.post(f"/applications/{app_id}/validate", headers=headers)
        assert val_res.status_code == 200
        val_data = val_res.json()
        assert "status" in val_data
        print(f"[PASS] Validation orchestrator executed. Resulting status: {val_data['status']}")

        # 7. Generate PDF Report
        rep_res = client.post(f"/applications/{app_id}/reports", headers=headers)
        assert rep_res.status_code == 200
        rep_data = rep_res.json()
        assert "download_url" in rep_data
        print(f"[PASS] Report generated: {rep_data['filename']}")

        # 8. Download PDF Report
        dl_url = f"http://127.0.0.1:8000{rep_data['download_url']}"
        dl_res = client.get(dl_url, headers=headers)
        assert dl_res.status_code == 200
        assert len(dl_res.content) > 1000
        print("[PASS] Report download verified (valid PDF bytes)")

        # 9. Test Institution Isolation
        inst_login = client.post("/auth/login", json={
            "email": "institution@demo.ac.in",
            "password": "DemoPass123!"
        })
        assert inst_login.status_code == 200
        inst_token = inst_login.json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        inst_apps_res = client.get("/applications", headers=inst_headers)
        assert inst_apps_res.status_code == 200
        inst_apps = inst_apps_res.json()
        # Should only see Apex Institute applications
        for a in inst_apps:
            assert a["institution_code"] == "1-109283741"
        print(f"[PASS] Institution isolation verified ({len(inst_apps)} applications for Apex Institute)")

if __name__ == "__main__":
    test_full_live_journey()
    print("\nALL LIVE END-TO-END TESTS COMPLETED SUCCESSFULLY!")
