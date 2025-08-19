#!/bin/bash

echo "🚀 Enabling Auto-Generation for Auto-Article System"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

# Function to update or add environment variable
update_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file=".env"
    
    if grep -q "^${var_name}=" "$env_file"; then
        # Variable exists, update it
        sed -i "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
        echo "✅ Updated ${var_name}=${var_value}"
    else
        # Variable doesn't exist, add it
        echo "${var_name}=${var_value}" >> "$env_file"
        echo "✅ Added ${var_name}=${var_value}"
    fi
}

echo ""
echo "🔧 Configuring Auto-Generation Settings..."

# Enable generation
update_env_var "ENABLE_GENERATION" "true"

# Set generation parameters
update_env_var "ARTICLES_PER_CATEGORY_PER_DAY" "2"
update_env_var "MAX_CATEGORIES_PER_RUN" "3"

# Error handling
update_env_var "STOP_ON_ERROR" "true"
update_env_var "LOG_RETENTION_DAYS" "10"

# Enable debug logging
update_env_var "DEBUG_GENERATION" "true"

echo ""
echo "📋 Current Auto-Generation Configuration:"
echo "========================================"
echo "• Per Category: 2 articles per day"
echo "• Max Categories per Run: 3"
echo "• Daily Schedule: 10 AM (every day)"
echo "• Error Handling: Stop on errors (saves tokens)"
echo "• Debug Logging: Enabled"
echo "• Clean Configuration: Removed unused settings"

echo ""
echo "🎯 Generation Strategy:"
echo "======================"
echo "• Generates 2 articles per category per day"
echo "• Completes ALL translations before next category"  
echo "• Runs DAILY at 10 AM (every single day)"
echo "• Stops immediately on errors to prevent token waste"
echo "• Automatically starts on server restart"
echo "• Clean codebase with only essential functions"

echo ""
echo "🔄 To restart and activate auto-generation:"
echo "==========================================="
echo "pm2 restart auto-article"
echo ""
echo "📊 To monitor generation:"
echo "========================"
echo "pm2 logs auto-article --lines 50"
echo "curl http://localhost:3000/generation/status"
echo "curl http://localhost:3000/analytics/dashboard"

echo ""
echo "✅ Auto-generation is now ENABLED and configured!"
echo "   Restart your application to activate: pm2 restart auto-article"
