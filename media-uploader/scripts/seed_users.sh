#!/bin/bash

# Demo User Seeding Script
# Creates demo users for development and testing

echo "🚀 Starting demo user seeding..."
echo "================================"

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
export API_URL=${API_URL:-"http://localhost:8000"}
export KRATOS_ADMIN_URL=${KRATOS_ADMIN_URL:-"http://localhost:4434"}
export KRATOS_PUBLIC_URL=${KRATOS_PUBLIC_URL:-"http://localhost:4433"}

# Check if we're in the right directory
if [ ! -f "scripts/seed_demo_users.py" ]; then
    echo "❌ Error: Please run this script from the media-uploader directory"
    echo "   cd media-uploader && ./scripts/seed_users.sh"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not found"
    exit 1
fi

# Check if required Python packages are available
echo "📦 Checking Python dependencies..."
python3 -c "
import sys
required = ['sqlalchemy', 'httpx', 'asyncio']
missing = []
for pkg in required:
    try:
        __import__(pkg)
    except ImportError:
        missing.append(pkg)

if missing:
    print(f'❌ Missing Python packages: {', '.join(missing)}')
    print('   Install with: pip install sqlalchemy httpx')
    sys.exit(1)
else:
    print('✅ All dependencies found')
"

if [ $? -ne 0 ]; then
    exit 1
fi

# Check if database is accessible
echo "🗄️  Checking database connection..."
python3 -c "
import sys
sys.path.insert(0, 'src')
try:
    from database import engine
    conn = engine.connect()
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    print('   Make sure the database is running and accessible')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    exit 1
fi

# Run the seeding script
echo "🌱 Running demo user seeding script..."
python3 scripts/seed_demo_users.py

# Check if the API server is running
echo ""
echo "🔍 Checking API server status..."
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    echo "✅ API server is running at ${API_URL}"
else
    echo "⚠️  API server may not be running at ${API_URL}"
    echo "   Start it with: uvicorn main:app --host 0.0.0.0 --port 8000"
fi

# Check if Kratos is running
echo ""
echo "🔐 Checking Kratos status..."
if curl -s -f "${KRATOS_PUBLIC_URL}/health/ready" > /dev/null 2>&1; then
    echo "✅ Kratos is running"
    echo "   Admin API: ${KRATOS_ADMIN_URL}"
    echo "   Public API: ${KRATOS_PUBLIC_URL}"
else
    echo "⚠️  Kratos may not be running"
    echo "   Start it with: docker-compose up kratos postgres"
fi

echo ""
echo "🎉 Demo user seeding complete!"
echo "================================"
echo ""
echo "📱 You can now test with these accounts:"
echo "   • student@example.com / demo123 (Student)"
echo "   • teacher@example.com / demo123 (Teacher)"  
echo "   • content@example.com / demo123 (Content Creator)"
echo "   • admin@example.com / demo123 (Admin)"
echo ""
echo "🌐 Frontend: http://localhost:3000/login"
echo "🔧 API: ${API_URL}"
echo "🔐 Kratos Admin: ${KRATOS_ADMIN_URL}"
echo ""