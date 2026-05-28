FROM nginx:1.27-alpine

# Custom server config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static site files only (keeps the image clean — no Dockerfile/.claude inside webroot)
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY index.html resume.html ./
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/
COPY resume-uz.pdf resume-ru.pdf resume-en.pdf ./

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
