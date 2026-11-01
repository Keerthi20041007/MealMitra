# MealMitra backend

## Run locally

1. Copy `.env.example` to `.env`.
2. Set a unique `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Add a Gemini API key as `GEMINI_API_KEY`; create one in [Google AI Studio](https://aistudio.google.com/apikey).
3. Make sure MongoDB is running.
4. Run `npm install` and `npm start`.

The NGO support assistant uses the Gemini API from the backend. Keep the API key and admin credentials in this backend `.env` file; never add them to frontend code or commit them.
