# Static site served by an unprivileged nginx (listens on :8080, runs as uid 101).
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Custom config: serve on 8080 with a /healthz endpoint for k8s probes.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets.
COPY index.html /usr/share/nginx/html/index.html
COPY assets /usr/share/nginx/html/assets

EXPOSE 8080
