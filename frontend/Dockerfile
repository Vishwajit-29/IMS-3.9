FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app for production
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose the app's port
EXPOSE 3000

# Set up environment variables with default value
ENV REACT_APP_API_URL=http://backend:8080/api

# Start the app using serve
CMD ["sh", "-c", "serve -s build -l 3000"] 