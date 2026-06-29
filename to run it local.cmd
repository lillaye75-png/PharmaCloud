# Backend
cd backend
python -m uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev

cd backend && python -m uvicorn app.main:app --reload
cd frontend && npm run dev
cd mobile && npx expo start








