FROM node:8-slim

WORKDIR /opt/interop-switch-js

COPY src ./src
COPY config ./config
COPY app.js ./
COPY index.js ./
COPY package.json /opt/interop-switch-js/
COPY package-lock.json /opt/interop-switch-js/
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

RUN npm install

ENTRYPOINT ["./entrypoint.sh"]
