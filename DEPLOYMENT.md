
# Breadcrumbs to how someone may deploy this repository

We used AWS or Azure for deployment, but generally, the deployment is done in a virtual machine, generally available almost everywhere. For cross vendor compatibility, please use an Ubuntu installer for your instance. You can use the Amazon Linux 2 as well, but you have to modify the installation in multiple parts.

Recommended requirements:
* 4 GB RAM
* 2 CPU is recommended

(t2.medium in AWS, Standard B2s in Azure)

## Create an EC2 (AWS)

Create a simple EC2 instance, and set up SSH to it. If your VM has less memory than 1 GB my recommendation is to add a swap file, to handle extensive memory usage.

**In cloud environment this is unusual, as the storage is high latency due to networking, and virtualization. This is only a cost saving measure, but can be effective, if your working memory doesn't exceeds the limit, and you have temporary memory limitations for example during compilations**.

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

It is also higly recommended to use tmux or any other solution for permanent shells in case you get disconnected.

```bash
sudo apt install tmux -y
tmux new -s deploy
```

## Install docker and npm

To use docker and npm for compilation, you have to install these first.
To install node, run this:

```bash
sudo apt install git -y
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
source ~/.bashrc   
nvm install node 16
```

To install docker and docker compose, first install docker, and then add the docker repository, and install docker compose

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt install docker-ce docker-compose-plugin
```

After this you may need to add yourself to the docker group, in case you get a [permission error](https://stackoverflow.com/questions/48957195/how-to-fix-docker-got-permission-denied-issue)
this can be replaced with using sudo with your docker commands, which is the preferred way

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```


## git clone the repository

To clone the repository my way was creating an ssh key, and adding it to the deploy keys in github.
There is a really [good tutorial](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) from Github as well.
  
To do so, first generate a new keypair, ans save it in the .ssh folder:

```bash
ssh-keygen -t ed25519 -C "deployment-key-aion"
```

Let's assume, the private key was saved as `.ssh/deploy_key`, and the public as `.ssh/deploy_key.pub`.

```bash
#start ssh agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/deploy_key
```

An alternative to this is to set it up inside the `.ssh/config` to connect with this key. This is prefered if you plan to restart the instance at least one time. The reason is that otherwise you have to restart the agent, and readd your keys, because they are not persistent.

```config 
Host git github.com
	HostName github.com
	IdentityFile ~/.ssh/deploy_key
	User git
```

After this step, add deploy_key.pub to the deploy keys in the repository.
[ Add the key here](https://github.com/a-gondolkodas-orome/durer-aion/settings/keys)

> Note: you may not have privileges to add the key, here, ask for help from the current admin of the repository if this happens.

Then you can clone the repository:

```bash
git clone git@github.com:a-gondolkodas-orome/durer-aion.git
```

## Build and run your application

After all of this, you should be able to follow the reademe on how to build your application, and host it.
It will be hosted default on port 80, and all the stuff will be running in the docker container(s).
You still need to set up the ssl certificate, and DNS.

## Access your docker containers

To access your docker coantainers, you have to find your containers first:

```bash
sudo docker ps
```

After this, select the id or the name of a container you want to connect to, and execute the following:
[docker exec | Docker Docs](https://docs.docker.com/engine/reference/commandline/exec/)

```bash 
sudo docker exec -it bash
```

This will give you a bash terminal ito that container, with sudo.
### Import teams

To run the import script use the following:

```bash
sudo docker exec -t durer-aion-backend-1 ./scripts/import_teams.sh scripts/test.tsv
```

## Add to a custom domain

After assigning a static ip address to the instance, you can use DNS to resolve it to the correct URL. You have to add an A record to your DNS, and then you can access the new website trough a fancy url. 
* Set up an elastic IP
* Set up an A record for the static IP adress. (This actually breaks the ssh connection, and you have to modify the trusted hosts list, if the instance is swapped)

## Add SSL
This is subject to change, will be updated by @HajosB144 .

### Use letsencript to get a ssl certificate for the virtual machine:

Install certbot ([example installation here](https://certbot.eff.org/instructions?ws=nginx&os=snap))

After installing, get a certificate like this:
```bash
sudo certbot --nginx -d <your_server_url name>
```


### Mount a directory to store the certs
If you want to set up the SSL termiantaion from the inside of the docker enviroment, you have to copy the setup from the local settings.


Make directory
```bash
mkdir /opt/fake-letsencrypt
```

Modify the docker-compose:
```diff
    web:
     build: ./nginx
     ports:
       - 80:80
+      - 443:443
     volumes:
       - ./build:/usr/share/nginx/html
+      - /opt/fake-letsencrypt:/etc/letsencrypt
     depends_on:
       - backend
```


### Run certbot

```bash
sudo docker run -p 80:80 -p 443:443 -it --rm --name certbot \
            -v "/opt/fake-letsencrypt:/etc/letsencrypt" \
            certbot/certbot certonly --standalone
```

This only generates thecerts, but not the ngnix setup enhancement.
If you want to do that as well, you may try:

```bash
sudo docker run -p 80:80 -p 443:443 -it --rm --name certbot \
            -v "/opt/fake-letsencrypt:/etc/letsencrypt" \
            certbot/certbot --standalone --ngnix
```

After this, apply the following changes to `nginx/nginx.conf`

```diff
@@ -1,5 +1,8 @@
 server {
-    listen       80;
+
+    server_name verseny.durerinfo.hu; # managed by Certbot

     location /socket.io/ {
         proxy_pass http://backend:8000;
@@ -19,4 +22,25 @@ server {
     location / {
         root   /usr/share/nginx/html;
         index  index.html index.htm;
     }
+    listen [::]:443 ssl ipv6only=on; # managed by Certbot
+    listen 443 ssl; # managed by Certbot
+    ssl_certificate /etc/letsencrypt/live/verseny.durerinfo.hu/fullchain.pem;
+    ssl_certificate_key /etc/letsencrypt/live/verseny.durerinfo.hu/privkey.pem;
+    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
+    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
+
+}
+
+server {
+    if ($host = verseny.durerinfo.hu) {
+        return 301 https://$host$request_uri;
+    } # managed by Certbot
+
+
+       listen 80 ;
+       listen [::]:80 ;
+    server_name verseny.durerinfo.hu;
+    return 404; # managed by Certbot
+
+
 }
```

# Deploy the b) version.

The b) version is deplyod on github pages. The site will be available at https://a-gondolkodas-orome.github.io/repository-name/

## Edit package.json

Find the 
```
  "scripts": {
    "predeploy": "cross-env PUBLIC_URL=/durer-aion REACT_APP_WHICH_VERSION=c npm run build",
```
lines in the package.json file, and change the predeploy line to 
```
    "predeploy": "cross-env PUBLIC_URL=/repository-name REACT_APP_WHICH_VERSION=c npm run build",
```
*Note: REACT_APP_WHICH_VERSION can be anything else than 'gh-pages'. If it's set to 'gh pages' the site will display a list of links to games, determined by src/index.tsx*
<br>You do **not** need to commit the change just save it locally.
## Deploy to pages

Run
```
npm run deploy
```

After this the site should be available on github.io.

# Troubleshoot

## npm ci
If the `npm ci` command returns with EACCESS error message, try 
```
sudo chown -R `whoami` node_modules
```
