# EC2 Deployment Guide for IMS

## Prerequisites

- AWS EC2 instance (Amazon Linux 2 or Ubuntu)
- Domain `www.vishwajit.tech` pointing to EC2 public IP
- SSH access to EC2

---

## Step 1: Install Docker on EC2

```bash
# For Amazon Linux 2
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
```

---

## Step 2: Install Nginx on EC2

```bash
# For Amazon Linux 2
sudo amazon-linux-extras install nginx1 -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 3: Install Certbot for SSL

```bash
# For Amazon Linux 2
sudo yum install -y python3-pip
sudo pip3 install certbot certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d www.vishwajit.tech -d vishwajit.tech
```

---

## Step 4: Clone and Deploy the Application

```bash
# Clone your repository
git clone <your-repo-url>
cd IMS-CICD/IMS-3.9

# Start all containers
docker-compose up -d --build

# Check if containers are running
docker-compose ps
```

---

## Step 5: Configure Nginx

```bash
# Copy the nginx config
sudo cp nginx/nginx.conf /etc/nginx/sites-available/ims

# Create symlink (Ubuntu) or include in nginx.conf (Amazon Linux)
# For Ubuntu:
sudo ln -s /etc/nginx/sites-available/ims /etc/nginx/sites-enabled/

# For Amazon Linux 2 (add to /etc/nginx/nginx.conf in http block):
# include /etc/nginx/sites-available/ims;

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 6: Open Firewall Ports

Make sure your EC2 Security Group allows:

- **Port 80** (HTTP)
- **Port 443** (HTTPS)
- **Port 22** (SSH)

---

## Verify Deployment

1. Open browser and go to: `https://www.vishwajit.tech`
2. You should see the IMS login page
3. Test API: `https://www.vishwajit.tech/api/health`

---

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Stop everything
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check nginx status
sudo systemctl status nginx

# Renew SSL certificate
sudo certbot renew
```

---

## Troubleshooting

### CORS Issues

Check that `ALLOWED_ORIGINS` in `docker-compose.yml` includes your domain.

### 502 Bad Gateway

Check if containers are running: `docker-compose ps`

### SSL Certificate Issues

Re-run certbot: `sudo certbot --nginx -d www.vishwajit.tech`
