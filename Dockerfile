FROM neilpang/acme.sh

RUN apk --update add nodejs npm curl

WORKDIR /app

ADD . /app

RUN npm install
RUN ls
RUN printenv

VOLUME ["/root/.acme.sh"]

# RUN ~/.acme.sh/acme.sh

ENTRYPOINT npm start
