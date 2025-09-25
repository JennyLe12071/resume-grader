#!/bin/bash

echo "🔧 Setting up IDP API configuration..."

# Check if .env file exists
if [ ! -f "api/.env" ]; then
    echo "📝 Creating api/.env file from template..."
    cp api/env.example api/.env
fi

echo "📋 Current IDP configuration:"
echo "   IDP_BASE_URL: $(grep IDP_BASE_URL api/.env || echo 'Not set')"
echo "   IDP_API_KEY: $(grep IDP_API_KEY api/.env || echo 'Not set')"

echo ""
echo "🔑 To configure your IDP API key:"
echo "   1. Edit api/.env file"
echo "   2. Set IDP_BASE_URL to your MuleSoft IDP endpoint"
echo "   3. Set IDP_API_KEY to your API key"
echo ""
echo "📝 Example:"
echo "   IDP_BASE_URL=\"https://your-mulesoft-idp-endpoint.com\""
echo "   IDP_API_KEY=\"your-actual-api-key-here\""
echo ""
echo "🚀 After updating, restart the API server to use real IDP processing"
echo ""
echo "💡 Without IDP configuration, the system will use mock data for testing"
