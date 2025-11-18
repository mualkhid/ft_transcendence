# File Watching and Polling in Docker Development

## Environment Variables Explanation

### CHOKIDAR_USEPOLLING=true

**Chokidar** is a file watching library used by many development tools (like Webpack, Vite, etc.) to detect file changes and trigger hot reloads.

- **Purpose**: Enables polling-based file watching instead of native file system events
- **Why needed in Docker**: Docker containers running on non-Linux hosts (Windows/macOS) often have issues with native file system events not propagating properly from the host to the container
- **How it works**: Instead of waiting for file system events, it periodically checks files for changes (polls them)
- **Trade-off**: Uses more CPU resources but ensures reliable file change detection

### WATCHPACK_POLLING=true

**Watchpack** is the file watching library used specifically by Webpack.

- **Purpose**: Forces Webpack to use polling for file watching
- **Why needed**: Similar to Chokidar, ensures Webpack can detect file changes in Docker environments
- **Effect**: Enables hot module replacement (HMR) and automatic rebuilds when you modify frontend code
- **Performance**: Slightly increases resource usage but essential for development workflow

## When These Are Needed

- **Docker on Windows/macOS**: File system events don't always work reliably
- **Network mounted volumes**: When source code is mounted from host to container
- **Development environments**: Where you want automatic rebuilds and hot reloading

## Alternative Solutions

Without polling, you might experience:
- Changes not triggering rebuilds
- Hot reload not working
- Need to manually restart containers after code changes

These environment variables ensure a smooth development experience by guaranteeing file change detection works properly in containerized environments.
