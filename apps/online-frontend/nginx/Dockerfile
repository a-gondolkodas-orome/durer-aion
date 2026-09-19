FROM nginx:1.30.4

EXPOSE 80
EXPOSE 443

COPY nginx.conf /etc/nginx/conf.d/default.conf

# The mount point for a deployment's TLS snippet; empty here on purpose.
RUN mkdir -p /etc/nginx/tls

# The healthcheck in docker-compose.yml probes this nginx over HTTP, and the base
# image ships no client to do it with — it purges the curl it builds with. Adding
# it here rather than guessing at what the image happens to carry means a missing
# package fails the build, loudly, instead of the healthcheck, silently.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && curl --version > /dev/null