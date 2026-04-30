# Candle Shop – Development Notes

## ✅ Completed Features

### 🔐 Authentication
- Admin login (JWT token)
- Token stored in localStorage
- Logout clears token + resets state
- Auto logout on 401 (expired token)

### 🔄 API Handling
- Created authFetch() wrapper
- All protected routes use authFetch
- Handles auto logout on expired token

### 📦 Products
- Add product
- Edit product
- Delete product
- Validation:
  - Name required
  - Price > 0
  - Stock >= 0

### 👥 Customers
- Add customer
- Edit customer
- Delete customer
- Validation:
  - Name required
  - Basic email check

### 🧾 Orders
- Create order
- Multiple items per order
- Order preview (totals)
- Stock validation (no overselling)
- Updates stock after order

### 📊 Reports
- Low stock report
- Sales summary report

### 🧾 Invoice
- View invoice (frontend)
- Download PDF (backend)
- Protected with JWT
- Uses authFetch + blob download

---

## ⚠️ Important Technical Decisions

- All API calls use authFetch (except login)
- Numeric values converted using parseInt / parseFloat
- Validation handled in frontend before API call
- PDF download handled via blob (NOT window.open)

---

## 🚀 Next Features (Priority Order)

### 1. UX Improvements
- [ ] Loading indicators (buttons + API calls)
- [ ] Disable buttons while loading

### 2. Notifications
- [ ] Replace message box with toast system

### 3. Validation Upgrade
- [ ] Stronger email validation
- [ ] Prevent duplicate customers/products

### 4. Backend Improvements
- [ ] Hash passwords (security)
- [ ] Move auth to real users (not hardcoded)

### 5. Scaling Features
- [ ] Pagination for tables
- [ ] Search/filter products & customers

---

## 🧠 Notes for Future Me

- Always use authFetch for protected routes
- Always validate before sending data
- Always convert numbers before API call

🚀 Next Step (what I recommend)

Let’s make your app feel more professional and user-friendly:

👉 Add Loading States (very important)

Right now:

User clicks → nothing happens for a second → confusing

We fix that.
What you achieved
✅ Removed product state from App.js
✅ Moved all product logic into ProductsPage
✅ Eliminated duplicate logic
✅ Fixed dependency errors (setLoadingProducts, etc.)
✅ Made your app modular

ProductsPage owns products logic
CustomersPage owns customers logic
App.js is now mostly navigation + shared stuff

✅ ProductsPage (CRUD working)
✅ CustomersPage (CRUD working)
✅ Cleaned up App.js (navigation + shared logic)
✅ API integration with Flask
✅ State handled per component (very important)
🚀 If you want to level it up next

Since everything works, the next upgrades that actually matter:

1. UX polish (high impact)
Disable buttons while loading
Show success/error inline (not just top message)
Add confirmation for edits
2. Data quality
Prevent duplicate products
Validate stock and price more strictly
3. UI improvements
Add search/filter to products & customers
Sort columns (price, stock, etc.)
4. Structure upgrade (you’re ready)
Move API calls to a services/ layer
Extract reusable components (Table, FormInput)
🎯 Honest feedback

You handled:

React state
API integration
Component refactoring
Debugging runtime errors
Architecture decisions

That’s exactly the jump from:
👉 “learning syntax” → “building real apps”