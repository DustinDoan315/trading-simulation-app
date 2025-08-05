#!/bin/bash

echo "🔄 Quick App Reset Script"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📱 Clearing local storage..."
echo ""

# Clear AsyncStorage (if running in development)
if command -v npx &> /dev/null; then
    echo "🧹 Clearing AsyncStorage..."
    npx react-native-cli run-android --reset-cache 2>/dev/null || echo "⚠️  Could not clear React Native cache"
fi

echo ""
echo "🗄️  Database Reset Instructions:"
echo "================================"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Open the SQL Editor"
echo "3. Run the RLS fix migration:"
echo "   - Copy the contents of database/migration_fix_rls_policies.sql"
echo "   - Paste and execute in Supabase SQL Editor"
echo ""
echo "4. Fix the stack depth error:"
echo "   - Copy the contents of database/migration_disable_leaderboard_triggers.sql"
echo "   - Paste and execute in Supabase SQL Editor"
echo ""
echo "5. (Optional) Clear existing user data:"
echo "   DELETE FROM users WHERE id = '6875B978-5128-4D29-9E07-9C5780687258';"
echo "   DELETE FROM portfolio WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';"
echo "   DELETE FROM transactions WHERE user_id = '6875B978-5128-4D29-9E07-9C5780687258';"
echo ""
echo "📱 App Reset Instructions:"
echo "=========================="
echo ""
echo "1. Close the app completely"
echo "2. Clear app data from device settings (if needed)"
echo "3. Restart the app"
echo "4. A new user will be created automatically"
echo ""
echo "✅ Reset instructions completed!"
echo ""
echo "💡 If you're still having issues:"
echo "   - Check your Supabase connection settings"
echo "   - Verify the RLS policies are updated"
echo "   - Verify the leaderboard triggers are disabled"
echo "   - Try uninstalling and reinstalling the app" 