FROM nginx:1.30.4

EXPOSE 80
EXPOSE 443

COPY nginx.conf /etc/nginx/conf.d/default.conf

# The mount point for a deployment's TLS snippet; empty here on purpose.
RUN mkdir -p /etc/nginx/tls