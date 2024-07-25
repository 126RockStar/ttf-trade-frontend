#Creates a layer from node:alpine image.
FROM node:18.0.0

#Creates directories
RUN mkdir -p /usr/src/frontend

#Sets the working directory for any RUN, CMD, ENTRYPOINT, COPY, and ADD commands
WORKDIR /usr/src/frontend

#Copy new files or directories into the filesystem of the container
COPY package*.json ./

#Execute commands in a new layer on top of the current image and commit the results
RUN npm i --legacy-peer-deps

##Copy new files or directories into the filesystem of the container
COPY . .

#Add environment variables to container before build
ENV REACT_APP_TRADE_URL="https://cryptostaging.irafi.com/api/trade"
ENV REACT_APP_CANDLES_URL="https://cryptostaging.irafi.com/api/candles"

#Build the app before image is pushed to ECR to avoid runtime memory issues
RUN npm run build

#Informs container runtime that the container listens on the specified network ports at runtime
EXPOSE 3000

#Allows you to configure a container that will run as an executable
# ENTRYPOINT npm run start:production
ENTRYPOINT ["sh", "entrypoint.sh"]
