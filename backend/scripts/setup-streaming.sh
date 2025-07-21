#!/bin/bash

# NGINX RTMP Streaming Setup Script
# This script sets up a complete RTMP streaming server with HLS output
# Compatible with OBS Studio and other RTMP broadcasters

set -e

echo "🎙️ Setting up NGINX RTMP Streaming Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Detect OS
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect OS version"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Update system packages
print_status "Updating system packages..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt-get update
    PACKAGE_MANAGER="apt-get"
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum update -y
    PACKAGE_MANAGER="yum"
else
    print_error "Unsupported OS: $OS"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
if [[ "$PACKAGE_MANAGER" == "apt-get" ]]; then
    apt-get install -y build-essential libpcre3 libpcre3-dev libssl-dev zlib1g-dev unzip wget curl ffmpeg
elif [[ "$PACKAGE_MANAGER" == "yum" ]]; then
    yum groupinstall -y "Development Tools"
    yum install -y pcre-devel openssl-devel zlib-devel unzip wget curl
    # Install FFmpeg from EPEL
    yum install -y epel-release
    yum install -y ffmpeg
fi

# Create nginx user if it doesn't exist
if ! id "nginx" &>/dev/null; then
    print_status "Creating nginx user..."
    useradd -r -d /var/cache/nginx -s /sbin/nologin nginx
fi

# Download and compile NGINX with RTMP module
NGINX_VERSION="1.24.0"
RTMP_VERSION="1.2.2"

print_status "Downloading NGINX $NGINX_VERSION and RTMP module $RTMP_VERSION..."

cd /tmp
wget -q http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz
wget -q https://github.com/arut/nginx-rtmp-module/archive/v${RTMP_VERSION}.tar.gz

tar -xzf nginx-${NGINX_VERSION}.tar.gz
tar -xzf v${RTMP_VERSION}.tar.gz

cd nginx-${NGINX_VERSION}

print_status "Compiling NGINX with RTMP module..."
./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --user=nginx \
    --group=nginx \
    --with-compat \
    --with-file-aio \
    --with-threads \
    --with-http_addition_module \
    --with-http_auth_request_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_mp4_module \
    --with-http_random_index_module \
    --with-http_realip_module \
    --with-http_secure_link_module \
    --with-http_slice_module \
    --with-http_ssl_module \
    --with-http_stub_status_module \
    --with-http_sub_module \
    --with-http_v2_module \
    --with-stream \
    --with-stream_realip_module \
    --with-stream_ssl_module \
    --with-stream_ssl_preread_module \
    --add-module=../nginx-rtmp-module-${RTMP_VERSION}

make -j$(nproc)
make install

# Create necessary directories
print_status "Creating directories..."
mkdir -p /var/cache/nginx/client_temp
mkdir -p /var/cache/nginx/proxy_temp
mkdir -p /var/cache/nginx/fastcgi_temp
mkdir -p /var/cache/nginx/uwsgi_temp
mkdir -p /var/cache/nginx/scgi_temp
mkdir -p /var/www/html/hls
mkdir -p /var/recordings
mkdir -p /var/log/nginx

# Set permissions
chown -R nginx:nginx /var/cache/nginx
chown -R nginx:nginx /var/www/html/hls
chown -R nginx:nginx /var/recordings
chown -R nginx:nginx /var/log/nginx

# Copy NGINX configuration
print_status "Installing NGINX configuration..."
if [[ -f /etc/nginx/nginx.conf ]]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
fi

# Copy our custom nginx.conf
cp "$(dirname "$0")/../nginx/nginx.conf" /etc/nginx/nginx.conf

# Create systemd service file
print_status "Creating systemd service..."
cat > /etc/systemd/system/nginx.service << 'EOF'
[Unit]
Description=The nginx HTTP and reverse proxy server
After=network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
KillSignal=SIGQUIT
TimeoutStopSec=5
KillMode=process
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
print_status "Enabling and starting services..."
systemctl daemon-reload
systemctl enable nginx
systemctl start nginx

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 1935/tcp
    print_warning "Firewall rules added. Make sure to enable ufw if it's not already enabled."
fi

# Create cleanup script
print_status "Creating cleanup script..."
cat > /usr/local/bin/cleanup-streams.sh << 'EOF'
#!/bin/bash
# Cleanup old HLS segments and recordings

# Remove HLS segments older than 1 hour
find /var/www/html/hls -name "*.ts" -mmin +60 -delete
find /var/www/html/hls -name "*.m3u8" -mmin +60 -delete

# Remove recordings older than 30 days (adjust as needed)
find /var/recordings -name "*.flv" -mtime +30 -delete

# Remove empty directories
find /var/www/html/hls -type d -empty -delete
find /var/recordings -type d -empty -delete
EOF

chmod +x /usr/local/bin/cleanup-streams.sh

# Add cleanup to crontab
print_status "Setting up automatic cleanup..."
(crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/cleanup-streams.sh") | crontab -

# Create monitoring script
print_status "Creating monitoring script..."
cat > /usr/local/bin/stream-monitor.sh << 'EOF'
#!/bin/bash
# Monitor streaming server health

LOG_FILE="/var/log/stream-monitor.log"

# Check if NGINX is running
if ! pgrep nginx > /dev/null; then
    echo "$(date): NGINX is not running, attempting to start..." >> $LOG_FILE
    systemctl start nginx
fi

# Check disk space
DISK_USAGE=$(df /var/www/html/hls | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): High disk usage ($DISK_USAGE%), running cleanup..." >> $LOG_FILE
    /usr/local/bin/cleanup-streams.sh
fi

# Check if HLS directory is writable
if [ ! -w /var/www/html/hls ]; then
    echo "$(date): HLS directory not writable, fixing permissions..." >> $LOG_FILE
    chown -R nginx:nginx /var/www/html/hls
    chmod -R 755 /var/www/html/hls
fi
EOF

chmod +x /usr/local/bin/stream-monitor.sh

# Add monitoring to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/stream-monitor.sh") | crontab -

# Test NGINX configuration
print_status "Testing NGINX configuration..."
if nginx -t; then
    print_status "NGINX configuration is valid"
else
    print_error "NGINX configuration test failed"
    exit 1
fi

# Restart NGINX to apply configuration
systemctl restart nginx

# Display setup information
print_status "Setup completed successfully!"
echo ""
echo -e "${BLUE}📡 RTMP Streaming Server Setup Complete${NC}"
echo "=============================================="
echo ""
echo -e "${GREEN}RTMP Server:${NC} rtmp://$(hostname -I | awk '{print $1}'):1935/live"
echo -e "${GREEN}HLS Playback:${NC} http://$(hostname -I | awk '{print $1}'/hls/{stream_key}.m3u8"
echo -e "${GREEN}Statistics:${NC} http://$(hostname -I | awk '{print $1}'/stat"
echo ""
echo -e "${YELLOW}OBS Studio Setup:${NC}"
echo "1. Go to Settings > Stream"
echo "2. Service: Custom"
echo "3. Server: rtmp://$(hostname -I | awk '{print $1}'):1935/live"
echo "4. Stream Key: {your_stream_key_from_admin_panel}"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "• Configuration: /etc/nginx/nginx.conf"
echo "• HLS Files: /var/www/html/hls"
echo "• Recordings: /var/recordings"
echo "• Logs: /var/log/nginx/"
echo ""
echo -e "${YELLOW}Management Commands:${NC}"
echo "• Start: sudo systemctl start nginx"
echo "• Stop: sudo systemctl stop nginx"
echo "• Restart: sudo systemctl restart nginx"
echo "• Status: sudo systemctl status nginx"
echo "• Test config: sudo nginx -t"
echo ""
echo -e "${GREEN}✅ Your streaming server is ready!${NC}"

# Clean up temporary files
cd /
rm -rf /tmp/nginx-${NGINX_VERSION}*
rm -rf /tmp/v${RTMP_VERSION}.tar.gz