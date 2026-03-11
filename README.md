# ⚡ HeyMate — One App, Any Task, Any Time

Full-stack on-demand service marketplace — Spring Boot + React Native.

## 📁 Structure
```
heymate/
├── backend/    ← Spring Boot Java 21
└── mobile/     ← React Native Expo
```

## 🚀 Backend (IntelliJ IDEA)
1. Open IntelliJ → File → Open → select `backend/` folder
2. Wait for Maven to download dependencies
3. Edit `src/main/resources/application.properties` with your DB/API keys
4. Run → Run 'HeymateApplication'  (or Shift+F10)
5. API live at http://localhost:8080

## 📱 Mobile (VS Code)
```bash
cd mobile
npm install
npx expo start
# Press 'a' for Android, 'i' for iOS
```

Edit `src/api/index.js` BASE_URL to match your machine IP.

## 🗄️ Database (Docker)
```bash
docker run -d --name heymate-db \
  -e POSTGRES_PASSWORD=heymate123 \
  -e POSTGRES_DB=heymatedb \
  -p 5432:5432 postgis/postgis:15-3.3

docker run -d --name heymate-redis -p 6379:6379 redis:7
```
Then run `schema.sql` in your database.

## 🔑 Keys Needed
- Razorpay: https://dashboard.razorpay.com
- Firebase: https://console.firebase.google.com (download service account JSON)
- Google Maps: https://console.cloud.google.com

## 📡 Key APIs
- POST /api/auth/register  — Register user or provider
- POST /api/auth/login     — Login → JWT token
- GET  /api/providers/nearby?lat=&lng=&service= — Geo search
- POST /api/bookings       — Create booking
- PUT  /api/bookings/{id}/accept — Provider accepts
- POST /api/payments/initiate   — Razorpay order
- POST /api/emergency/sos       — SOS broadcast
- GET  /api/emergency/blood     — Find blood donors
- WS   /ws/tracking/{bookingId} — Live tracking
"# heymateApp" 
