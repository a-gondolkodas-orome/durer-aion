# Breadcrumbs to how someone may deploy this repository

I used AWS for deployment, but generally, the deployment is doen in a virtual machine, generally avaliable almost everywhere.
Because I used AWS EC2, my package manager was yum. This may complicates your workflow.

## Create an EC2

Create a simple EC2 instance, and set up ssh to it.
It is highly recommneded to add a swap file, to handle extensive memory usage, especially if your VM has less memory than 1GB.

```bash
sudo dd if=/dev/zero of=/swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

It is also higly recommended to use tmux or any other solution for permanent shells in case you get disconnected.
```bash
sudo yum install tmux -y
tmux new -s deploy
```

## Install docker and npm

To use docker and npm for compilation, you ave to install these first.
```bash
sudo yum install docker nodejs -y
#install docker compose based on https://stackoverflow.com/questions/63708035/installing-docker-compose-on-amazon-ec2-linux-2-9kb-docker-compose-file
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

after this you may add yourself to teh docekr group, in case you get a [permission error](https://stackoverflow.com/questions/48957195/how-to-fix-docker-got-permission-denied-issue)
The alternative for this is to use `sudo` with all docker commands. USING `sudo` IS RECOMMENDED!



```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

After all this, you have to start docker based on the [documentation](https://docs.docker.com/config/daemon/start/)
```bash
sudo systemctl start docker
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

After this step, add deploy_key.pub to the deploy keys in the repository.
(Image maybe?)

Then you can clone the repository:
```bash
git clone git@github.com:a-gondolkodas-orome/durer-aion.git
```

## Build and stuff

After all of this, you should be able to follow the reademe on how to build your application, and host it.
It will be hosted default on port 80, and all the stuff will be running in the docker container(s).

You still need to set up the ssl certificate, and DNS.

## Access your docker containers

To acces your docker coantainers, you have to find your containers first:
```bash
sudo docker ps
```

After this, select the id or the name of a container you want to connect to, and execute the following:
```bash 
sudo docker exec -it bash
```

This will give you a bash terminal ito that container, with sudo.

## Add SSL

TODO!