@echo off
echo 🔧 Setting up Vercel Environment Variables
echo ==========================================

echo.
echo Adding DATABASE_URL...
echo postgresql://neondb_owner:npg_iE2wuqaHgO6c@ep-summer-wave-abtfvjyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require^&channel_binding=require | npx vercel env add DATABASE_URL production

echo.
echo Adding JWT_SECRET...
echo 5c9532fc21a0e0db70f172b75db86d02fd479bfd7109a0c3e0cff87f938e2f6ec11800d491bfa137169462e566d3046d | npx vercel env add JWT_SECRET production

echo.
echo Adding NODE_ENV...
echo production | npx vercel env add NODE_ENV production

echo.
echo Adding ADMIN_USERNAME...
echo admin | npx vercel env add ADMIN_USERNAME production

echo.
echo Adding ADMIN_PASSWORD...
echo wedding2025 | npx vercel env add ADMIN_PASSWORD production

echo.
echo ✅ Environment variables setup complete!
echo.
echo 🚀 Redeploying with new environment variables...
npx vercel --prod

echo.
echo 🎉 Deployment complete! Your site should now work properly.
pause