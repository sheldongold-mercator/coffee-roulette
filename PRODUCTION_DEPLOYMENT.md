# Coffee Roulette - Production Deployment Guide

## Server: https://ec2-100-52-223-104.compute-1.amazonaws.com

---

## Prerequisites Checklist

### 1. Azure AD Configuration
- [ ] Add production redirect URIs to Azure AD app registration
  - SPA Platform: `https://ec2-100-52-223-104.compute-1.amazonaws.com`
  - Web Platform: `https://ec2-100-52-223-104.compute-1.amazonaws.com/api/auth/callback`
- [ ] Ensure app is configured as multi-tenant
- [ ] Grant `User.Read.All` API permission with admin consent for target tenant

### 2. EC2 Instance Setup
- [ ] Instance running with Docker and Docker Compose installed
- [ ] Port 80 (HTTP) open in security group
- [ ] Port 443 (HTTPS) open in security group (for future SSL)
- [ ] SSH access configured

### 3. SSL Certificate (Recommended for Production)
- [ ] Obtain SSL certificate (Let's Encrypt, AWS Certificate Manager, etc.)
- [ ] Configure reverse proxy (nginx) for HTTPS
- [ ] Update redirect URIs to use https://

---

## Step-by-Step Deployment

### Step 1: Prepare Production Environment File

Before deploying, update `.env.production` with secure values:

```bash
# Generate secure JWT secret
openssl rand -base64 64

# Generate secure database passwords
openssl rand -base64 32  # for DB_PASSWORD
openssl rand -base64 32  # for DB_ROOT_PASSWORD
```

**Update these values in `.env.production`:**
- `JWT_SECRET` - Use output from first openssl command
- `DB_PASSWORD` - Use output from second openssl command
- `DB_ROOT_PASSWORD` - Use output from third openssl command
- `AWS_ACCESS_KEY_ID` - Your AWS access key (if using SES for emails)
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key (if using SES for emails)

### Step 2: Connect to EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@ec2-100-52-223-104.compute-1.amazonaws.com

# Or if using ubuntu
ssh -i your-key.pem ubuntu@ec2-100-52-223-104.compute-1.amazonaws.com
```

### Step 3: Install Docker and Docker Compose (if not already installed)

```bash
# Update system
sudo yum update -y  # For Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Docker
sudo yum install docker -y  # Amazon Linux
# OR
sudo apt install docker.io -y  # Ubuntu

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Deploy Application

```bash
# Create application directory
sudo mkdir -p /opt/coffee-roulette
sudo chown $USER:$USER /opt/coffee-roulette
cd /opt/coffee-roulette

# Clone repository (or upload files via SCP)
git clone https://github.com/sheldongold-mercator/coffee-roulette.git .

# Copy production environment file
cp .env.production .env

# Edit .env with your secure values (use nano or vi)
nano .env

# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check running containers
docker-compose ps

# Check backend health
curl http://localhost:3000/health

# Check MySQL connection
docker exec coffee-roulette-mysql mysql -uapp_user -p coffee_roulette -e "SHOW TABLES;"
```

### Step 6: Access Application

Open browser and navigate to:
```
https://ec2-100-52-223-104.compute-1.amazonaws.com
```

---

## Post-Deployment Configuration

### 1. Set Up SSL/HTTPS (Highly Recommended)

**Option A: Using Let's Encrypt with Nginx**

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name ec2-100-52-223-104.compute-1.amazonaws.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name ec2-100-52-223-104.compute-1.amazonaws.com;

    ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option B: Using AWS Application Load Balancer**
- Create ALB with SSL certificate from ACM
- Configure target groups for frontend (port 80) and backend (port 3000)
- Update security groups to allow traffic from ALB only

### 2. Set Up Admin User

Once deployed, you'll need to manually grant admin access:

```bash
# SSH into server
ssh -i your-key.pem ec2-user@ec2-100-52-223-104.compute-1.amazonaws.com

# Connect to MySQL
docker exec -it coffee-roulette-mysql mysql -uroot -p coffee_roulette

# Find your user ID (after first login via web UI)
SELECT id, email FROM users WHERE email = 'your.email@mercator.group';

# Grant super admin access
INSERT INTO admin_users (user_id, role) VALUES (YOUR_USER_ID, 'super_admin');

# Verify
SELECT au.id, au.role, u.email
FROM admin_users au
JOIN users u ON au.user_id = u.id;
```

### 3. Configure Automated Backups

```bash
# Create backup script
cat > /opt/coffee-roulette/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/coffee-roulette/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker exec coffee-roulette-mysql mysqldump -uroot -p$DB_ROOT_PASSWORD coffee_roulette > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/coffee-roulette/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line: 0 2 * * * /opt/coffee-roulette/backup.sh
```

---

## Monitoring and Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application
```bash
cd /opt/coffee-roulette
git pull origin master
docker-compose down
docker-compose up -d --build
```

### Database Maintenance
```bash
# Access MySQL
docker exec -it coffee-roulette-mysql mysql -uroot -p coffee_roulette

# Show database size
SELECT
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'coffee_roulette';
```

---

## Troubleshooting

### Issue: Cannot access application
```bash
# Check if containers are running
docker-compose ps

# Check if ports are accessible
netstat -tuln | grep -E '80|3000'

# Check security group (AWS Console)
# Ensure ports 80 and 443 are open to 0.0.0.0/0
```

### Issue: Database connection failed
```bash
# Check MySQL logs
docker-compose logs mysql

# Verify database credentials in .env
cat .env | grep DB_

# Test connection
docker exec coffee-roulette-mysql mysql -uapp_user -pYOUR_PASSWORD -e "SELECT 1;"
```

### Issue: Microsoft OAuth not working
- Verify redirect URIs in Azure AD exactly match production URL
- Check REACT_APP_REDIRECT_URI and MICROSOFT_REDIRECT_URI in .env files
- Ensure SSL is properly configured (Microsoft may require HTTPS)

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules (only allow necessary ports)
- [ ] Regular security updates (`docker-compose pull && docker-compose up -d`)
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Use AWS Secrets Manager or similar for sensitive credentials
- [ ] Enable AWS CloudWatch for monitoring
- [ ] Set up alerts for critical errors

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review this deployment guide
- Check GitHub repository issues
