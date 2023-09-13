
# Breadcrumbs to how someone may deploy this repository

I used AWS for deployment, but generally, the deployment is done in a virtual machine, generally avaliable almost everywhere.
Because I used AWS EC2, my package manager was yum. This may complicates your workflow.

## Create an EC2

Create a simple EC2 instance, and set up ssh to it. If your VM has less memory than 1GBt my recommnedation is to add a swap file, to handle extensive memory usage. In clud enviroment this is unusual, as the storage is high latency due to networkind, and virtualisation. This is only a cost saving measure, but can be effective, if your working memory doesn't exceeds the limit, and you have temporary memory limitations for example during compilations.

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

After this you may need to add yourself to the docekr group, in case you get a [permission error](https://stackoverflow.com/questions/48957195/how-to-fix-docker-got-permission-denied-issue)
this can be replaced with using sudo with your docekr commands, which is the prefered way

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
(Image maybe?)

Then you can clone the repository:

```bash
git clone git@github.com:a-gondolkodas-orome/durer-aion.git
```

## Build and run your application

After all of this, you should be able to follow the reademe on how to build your application, and host it.
It will be hosted default on port 80, and all the stuff will be running in the docker container(s).
You still need to set up the ssl certificate, and DNS.

## Access your docker containers

To acces your docker coantainers, you have to find your containers first:

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
sudo docker exec -t durer-aion-backend-1 ./import_teams.sh test.tsv
```

## Add to a custom domain

After assigning a static ip address to the instatnce, you can use DNS to resolve it to the correct URL. You have to add an A record to your DNS, and then you can access the new website trough a fancy url. 
* Set up an elastic IP
* Set up an A record for the static IP adress. (This actually breaks the ssh connection, and you have to modify the trusted hosts list, if the instance is swapped)

## Add SSL

TODO!
