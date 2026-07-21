# PISTOS LOYALTY APP — KATALON TEST IMPLEMENTATION SUMMARY

Total Test Cases: **47 Test Cases**  
Total Test Suites: **8 Test Suites**  
Test Suite Collections: **`TSC_Full_E2E_Suites.tsc`** & **`TSC_All_Suites.tsc`**

---

## 📋 Complete Test Cases Inventory (47 Test Cases)

### 1. Authentication & Authorization (7 TC)
* **Test Suite:** `TS_Auth_Smoke` (Smoke Tests) & `TS_Auth_Negative` (Negative Tests)
* **Location:** `Test Cases/Auth/`

| # | Test Case ID | Category | Description | Status |
|---|---|---|---|---|
| 1 | `TC_Login_Success` | Smoke | Verify successful login with valid member credentials | ✅ Active |
| 2 | `TC_Register_Success` | Smoke | Verify successful registration of new platform member | ✅ Active |
| 3 | `TC_Login_InvalidEmail` | Negative | Verify login validation for malformed email format | ✅ Active |
| 4 | `TC_Login_WrongPassword` | Negative | Verify login rejection for incorrect password | ✅ Active |
| 5 | `TC_Register_DuplicateEmail` | Negative | Verify registration rejection for already registered email | ✅ Active |
| 6 | `TC_Register_MissingAgreement` | Negative | Verify registration rejection when terms checkbox unchecked | ✅ Active |
| 7 | `TC_Register_PasswordMismatch` | Negative | Verify registration rejection when passwords do not match | ✅ Active |

---

### 2. Admin Portal & Management (8 TC)
* **Test Suite:** `TS_Admin_Management`
* **Location:** `Test Cases/Admin/`

| # | Test Case ID | Description | Status |
|---|---|---|---|
| 8 | `TC_Admin_Login_Success` | Verify admin authentication and dashboard header detection | ✅ Active |
| 9 | `TC_Admin_Update_Member_Status` | Verify admin can toggle member status between ACTIVE & INACTIVE | ✅ Active |
| 10 | `TC_Admin_Privacy_Restriction` | Verify admin is forbidden from viewing member points balance | ✅ Active |
| 11 | `TC_Admin_Create_Partner` | Verify admin can register new merchant partner (KFC/McD) | ✅ Active |
| 12 | `TC_Admin_Configure_Exchange_Rate` | Verify admin can add directional exchange rates | ✅ Active |
| 13 | `TC_Admin_Create_New_Reward` | Verify admin can create new reward catalog item | ✅ Active |
| 14 | `TC_Admin_Verify_Transaction_Privacy_Restriction` | Verify admin is forbidden from viewing member transaction history | ✅ Active |
| 15 | `TC_Admin_Export_PDF_Dashboard` | Verify admin can click Download PDF export button on dashboard | ✅ Active |

---

### 3. Partner / Merchant Management (10 TC)
* **Test Suite:** `TS_Partner_Management`
* **Location:** `Test Cases/Admin/`

| # | Test Case ID | Description | Status |
|---|---|---|---|
| 16 | `TC_Partner_View_List_All` | Verify admin can view list of all registered partners | ✅ Active |
| 17 | `TC_Partner_Search_By_Name` | Verify searching partners by merchant name | ✅ Active |
| 18 | `TC_Partner_Search_By_Code` | Verify searching partners by merchant code (e.g. KFC) | ✅ Active |
| 19 | `TC_Partner_Create_Duplicate_Code_Error` | Verify error when creating partner with existing code | ✅ Active |
| 20 | `TC_Partner_Create_Invalid_Rate_Zero` | Verify validation error for rate <= 0 | ✅ Active |
| 21 | `TC_Partner_Edit_Update_ExpiryDays` | Verify admin can update partner point expiry duration | ✅ Active |
| 22 | `TC_Partner_Status_Toggle_ACTIVE_INACTIVE` | Verify toggling partner status between ACTIVE and INACTIVE | ✅ Active |
| 23 | `TC_Partner_Code_Immutable_After_Create` | Verify partner code field is disabled/read-only on edit modal | ✅ Active |
| 24 | `TC_Partner_Edit_Not_Found_404` | Verify 404 response for editing non-existent partner ID | ✅ Active |
| 25 | `TC_Partner_Not_Found_404` | Verify 404 response when querying invalid partner ID | ✅ Active |

---

### 4. Reward Catalog Management (8 TC)
* **Test Suite:** `TS_Reward_Management`
* **Location:** `Test Cases/Admin/`

| # | Test Case ID | Description | Status |
|---|---|---|---|
| 26 | `TC_Reward_View_All` | Verify admin can view all reward items in catalog | ✅ Active |
| 27 | `TC_Reward_Filter_By_Partner` | Verify filtering rewards by specific partner ID | ✅ Active |
| 28 | `TC_Reward_Create_Partner_Not_Found` | Verify error when creating reward for invalid partner ID | ✅ Active |
| 29 | `TC_Reward_Edit_Update_Name` | Verify updating reward title/name | ✅ Active |
| 30 | `TC_Reward_Edit_Update_Cost` | Verify updating reward point cost | ✅ Active |
| 31 | `TC_Reward_Edit_Update_Status` | Verify toggling reward status ACTIVE / INACTIVE | ✅ Active |
| 32 | `TC_Reward_Edit_Not_Found` | Verify 404 response when editing non-existent reward ID | ✅ Active |
| 33 | `TC_Reward_Cache_Invalidation_After_Edit` | Verify reward updates immediately invalidate client cache | ✅ Active |

---

### 5. Member Portal Features (5 TC)
* **Test Suite:** `TS_Member_Portal`
* **Location:** `Test Cases/Member/`

| # | Test Case ID | Description | Status |
|---|---|---|---|
| 34 | `TC_Member_View_Points` | Verify member can view point balance per partner on dashboard | ✅ Active |
| 35 | `TC_Member_Transaction_History` | Verify member can view transaction history log | ✅ Active |
| 36 | `TC_Member_View_Profile_And_Logout` | Verify member profile viewing and logout mechanism | ✅ Active |
| 37 | `TC_Member_Exchange_Points` | Verify successful point exchange between partner pairs | ✅ Active |
| 38 | `TC_Member_Redeem_Reward` | Verify successful reward redemption from catalog | ✅ Active |

---

### 6. Security, Guard & Access Control (5 TC)
* **Test Suite:** `TS_Security_Auth_Guard`
* **Location:** `Test Cases/Security/`

| # | Test Case ID | Description | Status |
|---|---|---|---|
| 39 | `TC_Guard_Unauthenticated_Redirect` | Verify unauthenticated users attempting protected routes are redirected to `/login` | ✅ Active |
| 40 | `TC_Guard_Member_Access_Admin_Forbidden` | Verify MEMBER role accessing `/admin` is redirected back to `/dashboard` | ✅ Active |
| 41 | `TC_Guard_Admin_Access_Member_Dashboard_Forbidden` | Verify ADMIN role accessing `/dashboard` is redirected back to `/admin` | ✅ Active |
| 42 | `TC_Partner_Inactive_Cannot_Redeem` | Verify inactive partner cannot participate in reward redemptions on `/rewards` | ✅ Active |
| 43 | `TC_Partner_Inactive_Cannot_Exchange` | Verify inactive partner cannot participate in point exchange | ✅ Active |

---

### 7. Validation & Edge Cases (4 TC)
* **Test Suite:** `TS_Validation_Edge_Cases`
* **Location:** `Test Cases/Validation/`

| # | Test Case ID | Description | Status |
|---|---|---|---|
| 44 | `TC_Exchange_Insufficient_Points` | Verify UI auto-clamps/caps input amount to max available balance | ✅ Active |
| 45 | `TC_Register_Duplicate_Phone` | Verify registration rejection for duplicate phone number (V6 constraint) | ✅ Active |
| 46 | `TC_Login_Invalid_Credentials` | Verify login failure message for non-existent account | ✅ Active |
| 47 | `TC_Register_Validation_Errors` | Verify form input inline error messages for invalid inputs | ✅ Active |

---

## 🚀 How to Execute All Test Suites

To execute the entire 47 Test Cases suite sequentially in Katalon Studio:

1. Open Katalon Studio.
2. In the **Tests Explorer** panel, navigate to `Test Suites`.
3. Double click **`TSC_Full_E2E_Suites.tsc`** (or **`TSC_All_Suites.tsc`**).
4. Click **Run** (▶️).
