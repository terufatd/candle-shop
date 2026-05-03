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
Nice — that’s a big milestone 👍
Your code is now safely committed locally.

🚀 Next: Push to GitHub
1. Create repo on GitHub

Go to:
👉 GitHub

Click New repository
Name: candle-shop
❌ Do NOT initialize with README
2. Copy the commands GitHub gives you

Run in PowerShell (from your project root):

git remote add origin https://github.com/YOUR_USERNAME/candle-shop.git
git branch -M main
git push -u origin main

👉 Replace YOUR_USERNAME with your GitHub username

🔐 Login note (important)

GitHub may ask for:

Username ✔
Password ❌ (no longer works)

👉 Use a Personal Access Token (PAT) instead

If needed, I can guide you to create one.

🧪 Verify

After push:

Refresh your GitHub repo
You should see:
backend/
frontend/
DEV_NOTES.md
🎯 After this

Your project is:

✔ Backed up
✔ Shareable
✔ Ready for deployment
🔥 Next step

👉 Deploy backend (Flask → Render)
👉 Then frontend (React → Vercel)

Render still doesn’t see PyJWT in backend/requirements.txt.

Do this from your project root in PowerShell:

cd backend
pip install PyJWT
pip freeze | findstr PyJWT

You should see something like:

PyJWT==2.x.x

Then update requirements:

pip freeze > requirements.txt

Now check it:

findstr PyJWT requirements.txt

If it shows PyJWT==..., push it:

cd ..
git add backend/requirements.txt
git commit -m "Add PyJWT to requirements"
git push

Then redeploy on Render.

If git commit says “nothing to commit,” run:

git status

and tell me what it shows.
I recommend Aiven if you want free/simple.

Steps
Create cloud MySQL database.
Import your local candle_shop database into it.
Copy the cloud DB connection values.
In Render → your backend service → Environment Variables, set:
Your project now includes:

GitHub repo
Flask backend
React frontend
requirements.txt
package.json
.env.example
database backup (.sql)

That means you can:

move hosts easily
restore database anywhere
onboard another developer
rebuild the app from scratch
migrate to VPS/Docker later
🧠 You are now at a professional milestone

You have:

✔ version control
✔ deployment
✔ cloud backend
✔ environment separation
✔ DB backup strategy
✔ migration package

That is a real production workflow.
🎯 My recommendation
Next order of work
1. Create storefront home page
2. Add React Router
3. Separate public/admin pages
4. Add product images
5. THEN deploy frontend to Vercel

That will give you a much more professional app.