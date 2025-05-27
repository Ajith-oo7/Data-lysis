#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create production directory
echo "Creating production directory..."
mkdir -p production

# Copy necessary files
echo "Copying files to production directory..."
cp -r dist production/
cp package.json production/
cp .env production/

# Create PM2 ecosystem file
echo "Creating PM2 configuration..."
cat > production/ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'datalysis',
    script: 'dist/server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOL

echo "Deployment package is ready in the 'production' directory!"
echo "Next steps:"
echo "1. Upload the contents of the 'production' directory to your server"
echo "2. On your server, run:"
echo "   cd production"
echo "   npm install --production"
echo "   pm2 start ecosystem.config.js" 