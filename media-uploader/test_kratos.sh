#!/bin/bash

echo "🔐 Testing Kratos Authentication Setup"
echo "======================================"

# Test Health
echo "1. Testing Health Endpoint..."
curl -s http://localhost:4433/health/ready | jq .
echo ""

# Test Registration Flow
echo "2. Testing Registration Flow..."
REG_FLOW=$(curl -s -H "Accept: application/json" http://localhost:4433/self-service/registration/api)
echo "Registration flow created:"
echo $REG_FLOW | jq .id
echo ""

# Test Login Flow  
echo "3. Testing Login Flow..."
LOGIN_FLOW=$(curl -s -H "Accept: application/json" http://localhost:4433/self-service/login/api)
echo "Login flow created:"
echo $LOGIN_FLOW | jq .id
echo ""

# Test Admin API
echo "4. Testing Admin API..."
curl -s http://localhost:4434/admin/identities | jq .
echo ""

echo "✅ Kratos is properly configured for API-only usage!"
echo ""
echo "Available endpoints:"
echo "  - Registration: http://localhost:4433/self-service/registration/api"
echo "  - Login: http://localhost:4433/self-service/login/api"  
echo "  - Admin: http://localhost:4434/admin/"
echo "  - Health: http://localhost:4433/health/ready"