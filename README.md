We are gathered here today because we want to have multiple containers running on Amazon Web Services (AWS) and Elastic Beanstalk.
The reason for using Elastic Beanstalk is it’s the only experimental way to move code from local machine to Travis via Docker.

I wanted to share some common tools (really just commands) that will help us troubleshoot when (NOT if) we 
find ourselves in hot water. These commands are good to know, as they will help you extract some information about 
your containers and give you ways to troubleshoot. 

#Toolset: Commands   
You do not have to memorize them, although I am sure you will. Just know that they are here for you if you need them.
The tutorial we are about to do deploys a simple Node server app; 
these will come useful however when you are trying to standup your apps. :) 
    
| Command/Location | Description |
| --- | --- |
| cat /ect/hosts  | Not docker specific - this is a file with hosts table  |
| docker inspect <container Name|| ID> | JSON data about your container  |
| eb local run  | Run your app locally on boot2docker VM, before testing it on AWS |
| eb local status  | Shows containers IP and address and the open ports |
| eb local open  | Opens the application in a web browser and exits |
| curl http://localhost:51678/v1/tasks  | Not on your local machine, but when you are inside AWS and - see ### Inspect tasks under  "/ecs-agent", |
| Task Definition | This is your Dockerrun.aws.json v2 (reference is below) - file that setups up tasks required for AWS to setup your instances |

Btw, this is unrelated to the demo. But logo from Docker Machine is awesome. :)
![Awesome Docker machine image](https://github.com/docker/machine/blob/master/docs/img/logo.png) 


### Before It Begins

I'll be referring to commands executed in your own terminal with:

```
    $osxterm: command
```

Commands inside a container with:
```
    $ root: command
```

Output after running a command (in container or your terminal) with:
```
    %: output 
```

Output after running a command inside Mongo Shell: 
```
    > output 
```


## STEP0 --- From Git to Elastic Beanstalk in 5 Minutes
In the first part of this tutorial, we will begin by setting a sample application and deploying it to AWS via 
Elastic Beanstalk. After we are done with STEP0, we will add Travis. Travis will be a piece of cake, so STEP0 is the 
majority of the work (All the hard work into setup and then the payoff.). 


### Fork This Repo to Follow Along—Our Example Repo to Your Local Machine 

[] Fork https://github.com/georgebatalinski/ri-demo-docker-travis-aws.git
[] Delete .travis.yml && Dockerrun.aws.json

```
git clone https://github.com/georgebatalinski/ri-demo-docker-travis-aws.git
```
        
1. We will be using the Command line for this tutorial. However, you can easily achieve all of this
via [WEB CONSOLE](https://console.aws.amazon.com/elasticbeanstalk)

IF you decided to use [WEB CONSOLE], do the following (otherwise, skip to point 2):
    I. [Login](https://console.aws.amazon.com/elasticbeanstalk/?region=us-east-1#/applications)
    II. Upper-right-hand corner: [Create New Application]
        I. Follow the steps that are provided by Amazon 
        NOTE: New environment: 'Create web server' 
        II. When it asks UPLOAD, click on 'Upload' button and select only your Dockerrun.aws.json 
            If you decided to go via WEB CONSOLE,
                skip to ### []Dockerrun.aws.json v2

2. We will need to setup permissions in order to allow Elastic Beanstalk to create/manage our instances.
Since AWS uses multiple services to assemble Docker for us, Elastic Beanstalk will need to speak to the Amazon ECS container agent, 
and you will have to add the Policy in AWS Identity and Access Management (IAM). 

Here is a good tutorial on exactly how to do it -> 
I. Follow these steps [Click here for step by step guide](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker_ecstutorial.html#create_deploy_docker_ecstutorial_role)
II. When you are done, you should have: 
    []Created Policy area in IAM
    []Create a Role
    []Attached the policy to the role 

       
3. cd into our cloned directory above and create the environment inside Elastic Beanstalk. eb will do the talking.

Roadmap check:
[X] Cloned the repo
[X] Added Role/Policy

```
$ eb init
$ eb create dev-env
```

You got it. Maybe it took a bit longer over our allocated time of 5 minutes, but it was not our fault. It was 
all Elastic Beanstalk provisioning the 'dev-env' (It can take up to approximately 12 minutes to spin the environment.).


### [] Create a File - Dockerrun.aws.json 
NOTE: v2 is for multi-container (more than one container). 
This file defines the Amazon ECS task definition used to configure container instances in the environment.
Amazon ECS Task is "containerDefinitions" inside our Dockerrun.aws.json, which is run by Elastic Beanstalk 
whenever an instance is added.
[Reference.](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker_v2config.html#create_deploy_docker_v2config_dockerrun)


1. Create a file named [Dockerrun.aws.json]. In your git repo, copy and paste the following JSON 

Dockerrun.aws.json
```
{
  "AWSEBDockerrunVersion": 2,
    "volumes": [
    {
      "name": "db",
      "host": {
        "sourcePath": "/src"
      }
    }
  ],
  "containerDefinitions": [
    {
      "name": "server",
      "image": "georgebatalinski/docker-centos-simple-server-two:latest",
      "essential": true,
      "memory": 128,
      "portMappings": [
        {
          "hostPort": 80, //must be - PORT: 80 - See load balancer below for explanation
          "containerPort": 8080
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "db",
          "containerPath": "/src/money" //We are only mounting - "volumes" NOT creating new volumes
        }
      ],
      "links": [
        "db"
      ]
    },
    {
      "name": "db",
      "image": "mongo",
      "essential": true,
      "memory": 128,
      "portMappings": [
        {
          "hostPort": 27017,
          "containerPort": 27017
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "db",
          "containerPath": "/src/money"
        }
      ]
    }
  ]
}
 
```

The biggies:

```
    "volumes": [
    {
      "name": "db",
      "host": {
        "sourcePath": "/src"
      }
    }
  ],
```
Elastic Beanstalk will create an empty volume, 
and we get the following benefits: 
    I. We can share the volume between containers; 
    II. This volume will independently be mounted inside each container; 
    III. This volume will persist, even when our containers become stopped, which is helpful for backup
        making volumes, independent of container lifecycle.    
   

LOAD BALANCER loves port 80.
You get the load balancer by default. However, it likes to listen to "hostPort": 80.
In your Dockerrun.aws.json,you can setup the port mapping to:

```
"portMappings": [
        {
          "hostPort": 80,
          "containerPort": 8080
        }
      ],
```       
![This is your app with Load Balancer](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/images/aeb-multicontainer-docker-example.png)

NOTE: If you cannot set this up or require non-default port (i.e., unhappy with port 80), check out 
[Using Multiple Elastic Load Balancing Listeners.](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker_ecs.html)
   

### []Test Your EB CLI if You are Testing Your App Locally 

Roadmap check:
[] Cloned the repo
[] Added Role/Policy
[] There is a file named Dockerrun.aws.json in your main repo 

If you do not have the latest eb cli, then upgrade. REASON: I ran into some configuration issue, because of 
an older version. Do not waste your time and just update.

To install EB on OSX:
```
$osxterm: curl -s https://s3.amazonaws.com/elasticbeanstalk-cli-resources/install-ebcli.py | python
```

[Installing EB CLI for other platforms.](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html)



Once you have EB installed, run or open the project on our local machine.
eb local will use boot2docker to provide you the application without provisioning any AWS resources.

```
$osxterm: eb local run 
$osxterm: eb local open

```

If it runs on your local machine, you are ready for the big leagues. Move it over to Elastic Beanstalk on AWS.

```
$osxterm: eb deploy

```

#### Troubleshooting: If You Can’t Open the App 

```
$osxterm: eb local status 

%: ....
Container name: elasticbeanstalk_server_1
Container ip: 192.168.59.103
Container running: False
Exposed host port(s): None
Full local URL(s): None
...

```
If exposed host port(s): 80 or Full local URL(s): 192.168.59.103:80 are not available, your containers are not running. 

eb local is using boot2docker to provide you the application without provisioning any AWS resources .
To get into this Virtual Machine, use ssh. 

```
$osxterm: boot2docker ssh
$: docker ps 
```

If you run into another issue, go over the table at the top of this page and see if you can troubleshoot it. 
If not, submit your issue in the comments. 
    

## STEP1 --- From Git to Elastic Beanstalk to Travis in 5 Minutes 

Roadmap check:
[] Cloned the repo
[] Added Role/Policy
[] There is a file named Dockerrun.aws.json in your main repo 
[] You got to open and see 'Hello World' in your browser. If not, go to the above section and find out why before proceeding.

The missing piece is Travis right now, so let’s set it up.

The Travis layer is next. Our expectation or where Travis is going to help us:     
    1. Run tests.
    2. Build our Docker image and push it to public repository, [Private Registry Push](https://docs.travis-ci.com/user/docker/)
    3. Move our Dockerrun.aws.json to Elastic Beanstalk.
    4. Turn green when successful. :)
    
### The Setup 
Sign up for a Travis account. 
Once you synced your account on https://travis-ci.org/ with your Git repo, the rest is two simple steps away.  


1. Create a file  .travis.yml in our local repo.

From Line:1 of the file, copy and paste this into .travis.yml
```
sudo: required
language: node_js
node_js:
- '4.1'
git:
  depth: 1
env:
  DOCKER_COMPOSE_VERSION: 1.5.0
services:
- docker

before_install:
- docker login -e="$DOCKER_EMAIL" -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
- docker build -t georgebatalinski/docker-centos-simple-server-two:latest .
- docker push georgebatalinski/docker-centos-simple-server-two

```

2. We are going to add our AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY 
by running the command below. We will be prompted for this information and Travis will encrypt it. 

WARNING: Do not upload your AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY without encyption to public repos,
or you may get unwanted charges from AWS If others have your root keys, they can use your account as they please.

```
$osxterm: travis setup elasticbeanstalk
%: ....
now you will be promted 
choose to encrypt
....

```

## Set These ENV vars on Your Local Machine that Travis will Use to Publish Your Docker Repo

```
$osxterm: travis env set DOCKER_EMAIL <youremail>
$osxterm: travis env set DOCKER_USERNAME <yourusername>
$osxterm: travis env set <yourpassword>
```


Once setup, push the changes to the repository, and Travis will run automatically. 
```
git commit -am 'first build via docker on elasticbean'
git push origin master
```

Check your Travis dashboard 
    and see the GREEN status .

Isn't that your favorite color?  :)


## General Troubleshooting Techniques for Docker Containers

### Docker Specific 

```
ps - show you running contatainers
logs -- show you logs 
diff      Inspect changes on a container's filesystem
events    Get real time events from the server
history   Show the history of an image
inspect   Return low-level information on a container or image
port      Lookup the public-facing port that is NAT-ed to PRIVATE_PORT

```


### Inspect Tasks Under "/ecs-agent"
If you can SSH into your instance, and you see "/ecs-agent" and no other containers running, your containers are not being built. 

```
$osxterm: sudo docker ps
$osxterm: curl http://localhost:51678/v1/tasks
```
[Introspection.](http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-agent-introspection.html)