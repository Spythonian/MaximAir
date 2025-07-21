# 🎙️ NGINX RTMP Streaming Server Setup Guide

This guide will help you set up a complete, production-ready RTMP streaming server that's compatible with OBS Studio and provides HLS streaming for web playback.

## 🚀 Quick Start

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+ server
- Root access (sudo privileges)
- Domain name (recommended for SSL)
- At least 2GB RAM and 20GB storage

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/iconic-fm.git
cd iconic-fm-backend
```

### 2. Run Setup Script
```bash
chmod +x scripts/setup-streaming.sh
sudo ./scripts/setup-streaming.sh
```

### 3. Configure Environment
```bash
# Edit your .env file
nano .env

# Add these variables:
DOMAIN=your-domain.com
RTMP_PORT=1935
HLS_PATH=/var/www/html/hls
RECORDINGS_PATH=/var/recordings
USE_SSL=true
```

### 4. Start Your Backend
```bash
npm install
npm run build
npm start
```

## 📡 How It Works

### Architecture Overview
```
OBS Studio → RTMP Server → HLS Transcoding → Web Player
     ↓              ↓              ↓
Authentication → Recording → Statistics
```

### Components
1. **NGINX RTMP Module**: Receives RTMP streams from OBS
2. **HLS Transcoding**: Converts RTMP to HLS for web playback
3. **Authentication API**: Validates stream keys
4. **Recording System**: Automatically records broadcasts
5. **Statistics API**: Tracks listeners and stream data

## 🎛️ OBS Studio Setup

### Step 1: Download OBS
- Visit [obsproject.com](https://obsproject.com/)
- Download and install OBS Studio

### Step 2: Configure Stream Settings
1. Open OBS Studio
2. Go to **Settings** → **Stream**
3. Configure as follows:
   - **Service**: Custom
   - **Server**: `rtmp://your-domain.com:1935/live`
   - **Stream Key**: (copy from admin panel)

### Step 3: Audio Setup
1. Add **Audio Input Capture** for microphones
2. Add **Audio Output Capture** for music/system audio
3. Adjust levels in the Audio Mixer
4. Set audio bitrate in **Settings** → **Output**:
   - Low Quality: 64 kbps
   - Medium Quality: 128 kbps
   - High Quality: 256 kbps
   - Ultra Quality: 320 kbps

### Step 4: Start Broadcasting
1. Click **Start Streaming** in OBS
2. Verify stream is active in admin panel
3. Update "Now Playing" metadata as needed

## 🌐 Admin Panel Usage

### Creating a Stream
1. Log into admin panel at `/admin/livestream`
2. Click **"Create New Stream"**
3. Fill in stream details:
   - **Title**: Name of your show
   - **Description**: Brief description
   - **Quality**: Choose audio quality
   - **Recording**: Enable/disable recording
4. Copy the generated **Stream Key**

### Managing Live Streams
- **View Active Streams**: See currently broadcasting streams
- **Update Metadata**: Change "Now Playing" information
- **Monitor Statistics**: Track listener count and duration
- **Access Recordings**: Download recorded broadcasts

### Stream Information
Each stream provides:
- **RTMP URL**: For OBS configuration
- **Stream Key**: Unique identifier for authentication
- **Playback URL**: HLS URL for web players
- **Statistics**: Real-time listener data

## 🔧 Server Configuration

### NGINX Configuration
The setup script creates `/etc/nginx/nginx.conf` with:
- RTMP server on port 1935
- HLS output directory
- Authentication callbacks
- Recording settings
- Multiple quality transcoding

### Directory Structure
```
/var/www/html/hls/     # HLS streaming files
/var/recordings/       # Recorded broadcasts
/var/log/nginx/        # Server logs
/etc/nginx/            # Configuration files
```

### Automatic Cleanup
- HLS segments older than 1 hour are removed
- Recordings older than 30 days are deleted
- Empty directories are cleaned up
- Runs every 15 minutes via cron

### Monitoring
- Stream health checks every 5 minutes
- Automatic NGINX restart if needed
- Disk space monitoring and cleanup
- Log rotation and management

## 🔒 Security & SSL

### SSL Certificate (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# Allow required ports
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 1935/tcp  # RTMP
sudo ufw enable
```

### Stream Authentication
- Each stream requires a unique key
- Keys are validated against your database
- Invalid keys are rejected automatically
- Stream start/end events are logged

## 📊 Monitoring & Analytics

### Real-time Statistics
- Current listener count
- Peak listener count
- Stream duration
- Audio quality metrics

### Stream Events
- Stream start/end times
- Authentication attempts
- Error conditions
- Listener connections

### Performance Monitoring
```bash
# Check NGINX status
sudo systemctl status nginx

# View RTMP statistics
curl http://your-domain.com/stat

# Monitor logs
sudo tail -f /var/log/nginx/error.log
```

## 🛠️ Troubleshooting

### Common Issues

#### OBS Can't Connect
1. Check stream key is correct
2. Verify RTMP URL format
3. Ensure port 1935 is open
4. Check server logs: `sudo tail -f /var/log/nginx/error.log`

#### No Audio in Stream
1. Verify audio sources in OBS
2. Check audio levels aren't muted
3. Confirm audio codec settings
4. Test with different bitrate

#### Stream Keeps Disconnecting
1. Check internet connection stability
2. Lower bitrate in OBS
3. Verify server resources (CPU/RAM)
4. Check for firewall blocking

#### Can't Hear Stream on Website
1. Verify HLS files are being created: `ls /var/www/html/hls/`
2. Check browser console for errors
3. Test playback URL directly
4. Ensure CORS headers are set

### Log Locations
```bash
# NGINX error logs
/var/log/nginx/error.log

# NGINX access logs
/var/log/nginx/access.log

# Stream monitoring logs
/var/log/stream-monitor.log

# Application logs
/path/to/your/app/logs/
```

### Useful Commands
```bash
# Restart NGINX
sudo systemctl restart nginx

# Test NGINX configuration
sudo nginx -t

# View active streams
curl http://localhost/stat

# Check disk space
df -h /var/www/html/hls/

# Monitor real-time logs
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Maintenance

### Regular Tasks
1. **Monitor disk space** - HLS files can accumulate
2. **Check recordings** - Archive or delete old files
3. **Update SSL certificates** - Renew before expiration
4. **Review logs** - Check for errors or issues
5. **Test streaming** - Verify everything works

### Backup Strategy
```bash
# Backup recordings
rsync -av /var/recordings/ /backup/recordings/

# Backup configuration
cp /etc/nginx/nginx.conf /backup/nginx.conf

# Backup database
mongodump --out /backup/mongodb/
```

### Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js application
git pull origin main
npm install
npm run build
pm2 restart all
```

## 📈 Scaling

### Multiple Streams
- Each stream gets a unique key
- Concurrent streams are supported
- Resource usage scales with stream count

### Load Balancing
- Use multiple NGINX servers
- Distribute streams across servers
- Implement health checks

### CDN Integration
- Serve HLS files from CDN
- Reduce server bandwidth
- Improve global performance

## 💡 Tips for Radio Staff

### Before Going Live
1. Test your setup with a private stream
2. Check audio levels and quality
3. Prepare your content and music
4. Update stream metadata

### During Broadcast
1. Monitor listener count in admin panel
2. Update "Now Playing" information regularly
3. Keep an eye on connection stability
4. Have backup content ready

### After Broadcast
1. Stop the stream in OBS
2. Check recording was saved
3. Review stream statistics
4. Archive or share recordings

## 🆘 Support

### Getting Help
1. Check this documentation first
2. Review server logs for errors
3. Test with minimal setup
4. Contact system administrator

### Reporting Issues
Include the following information:
- Server OS and version
- NGINX version
- Error messages from logs
- Steps to reproduce issue
- OBS settings and version

---

## 🎉 You're Ready to Stream!

Your RTMP streaming server is now configured and ready for professional radio broadcasting. The system provides:

✅ **OBS Compatibility** - Direct RTMP streaming from OBS Studio  
✅ **Web Playback** - HLS streaming for website integration  
✅ **Authentication** - Secure stream key validation  
✅ **Recording** - Automatic broadcast recording  
✅ **Monitoring** - Real-time statistics and health checks  
✅ **Scalability** - Support for multiple concurrent streams  

Happy broadcasting! 🎙️📻