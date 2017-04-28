# Network & Cloud Computing - Final Project (Part two - Cloud Container deployment)

## What does the project contain?
> It is a node project for posting and viewing sale ads by various users. 
> It also contains the installation steps, configurations required and the scripts to create a deployment of Node.js application on Google COntainer Engine creating a Kubernetes clusters and using docker images

## What is the environment being used?
> Google Cloud Engine(Google Compute Engine), 
> Node  
> Mongo DB(external service from MLab)
> Kubernetes
> Docker

## System requirement and setup
- Create Project on Google Cloud Platform
- Enable billing in Developer's console
- Debian-based virtual machine
- Google Cloud Shell activation to follow script
- [PROJECT_ID] from Home -> Dashboard

## Project Structure (folder: node_container_app)
- The project conatins an app.js to run the node application
- config.js holds all the configurations, connectionss and environment
- ads folder contains the js files for db logic and actions logic
- views contain the front end components
- package.json defines libraries to install using npm
- addhub files for kubectl cong=figurations and load balancer
- details.pdf describing details, steps and configurations
