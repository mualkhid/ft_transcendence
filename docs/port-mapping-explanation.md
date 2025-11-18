# Docker Port Mapping Explained

## What does "443:443" mean?

```yaml
ports:
  - "443:443"
  - "80:80"
```

## Simple Format

**"HOST_PORT:CONTAINER_PORT"**

- **Left side (443)**: Port on your computer (host)
- **Right side (443)**: Port inside the Docker container
- **The colon (:)**: Connects them together

## Real Example

`"443:443"` means:
- When someone visits `https://yoursite.com` (which uses port 443)
- Docker forwards that request to port 443 inside the nginx container
- The nginx container receives it and handles the HTTPS traffic

## Why These Specific Ports?

- **Port 443**: Standard port for HTTPS (secure web traffic)
- **Port 80**: Standard port for HTTP (regular web traffic)

## Other Examples

- `"8080:80"` - Your computer's port 8080 → container's port 80
- `"3000:3000"` - Your computer's port 3000 → container's port 3000
- `"5432:5432"` - Your computer's port 5432 → container's port 5432 (common for databases)

## What This Means for You

When you type `https://localhost` in your browser, it automatically goes to port 443, which Docker forwards to the nginx container that handles your website's security and routing.
