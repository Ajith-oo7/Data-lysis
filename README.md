# Datalysis

AI-powered data analysis platform using DeepSeek.

## Features

- Domain detection for data analysis
- Advanced data analysis with AI
- Interactive data visualization
- Real-time WebSocket communication
- Secure API endpoints

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- DeepSeek API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/datalysis.git
cd datalysis
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
DEEPSEEK_API_KEY=your-deepseek-api-key
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-session-secret
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`.

## Building for Production

Build the application:
```bash
npm run build
```

## Deployment

1. Run the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

2. Upload the contents of the `production` directory to your server.

3. On your server:
```bash
cd /path/to/production
npm install --production
pm2 start ecosystem.config.js
```

4. Configure Nginx:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/datalysis
sudo ln -s /etc/nginx/sites-available/datalysis /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

5. Set up SSL:
```bash
sudo certbot --nginx -d your-domain.com
```

## API Endpoints

- `POST /api/detect-domain`: Detect domain for data analysis
- `POST /api/analyze`: Analyze data
- `POST /api/visualize`: Generate visualizations
- `GET /api/tasks/:taskId`: Get task status
- `GET /health`: Health check endpoint

## WebSocket

The application uses WebSocket for real-time communication. Connect to:
```
ws://your-domain.com/ws
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 