# 🚀 Getting Started - Powerpuff Pong

## 🎯 **First Time Setup (Choose ONE option):**

### **Option 1: Super Easy (Recommended)**
```bash
npm run first-time
```
This does everything automatically!

### **Option 2: Step by Step**
```bash
# 1. Install tools needed
npm install

# 2. Build the game
npm run build

# 3. Start the game
npm run docker:compose
```

### **Option 3: Use the Shell Script**
```bash
./start.sh
```

## 🌐 **Play the Game**
Open your browser and go to: **http://localhost:8080**

## 🎮 **Game Controls**
- **Player 1 (Blossom - Pink)**: W/S keys
- **Player 2 (Bubbles - Blue)**: Up/Down arrow keys
- **Power-ups**: Space bar

## 🛑 **Stop the Game**
```bash
npm run docker:stop
```

## 🔄 **Restart the Game**
```bash
npm run docker:compose
```

## ❓ **What Each Command Does:**
- `npm install` - Downloads TypeScript and Tailwind CSS tools
- `npm run build` - Converts TypeScript to JavaScript and processes CSS
- `npm run docker:compose` - Starts the game server
- `npm run docker:stop` - Stops the game server

## 🐳 **Why Docker?**
- **Portable** - Works on any computer
- **Professional** - Uses nginx web server
- **Consistent** - Same setup everywhere
- **Easy** - One command to start/stop
