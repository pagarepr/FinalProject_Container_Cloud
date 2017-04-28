GCLOUD_PROJECT:=$(shell gcloud config list project --format="value(core.project)")

.PHONY: all
all: deploy

.PHONY: create-cluster
create-cluster:
	gcloud container clusters create adhub \
		--scope "cloud-platform" \
		--num-nodes 2
	gcloud container clusters get-credentials adhub

.PHONY: create-bucket
create-bucket:
	gsutil mb gs://$(GCLOUD_PROJECT)
    gsutil defacl set public-read gs://$(GCLOUD_PROJECT)

.PHONY: build
build:
	docker build -t gcr.io/$(GCLOUD_PROJECT)/adhub .

.PHONY: push
push: build
	gcloud docker push gcr.io/$(GCLOUD_PROJECT)/adhub

.PHONY: template
template:
	sed -i ".tmpl" "s/\[GCLOUD_PROJECT\]/$(GCLOUD_PROJECT)/g" adhub-frontend.yaml
	sed -i ".tmpl" "s/\[GCLOUD_PROJECT\]/$(GCLOUD_PROJECT)/g" adhub-worker.yaml

.PHONY: create-service
create-service:
	kubectl create -f adhub-service.yaml

.PHONY: deploy-frontend
deploy-frontend: push template
	kubectl create -f adhub-frontend.yaml

.PHONY: deploy-worker
deploy-worker: push template
	kubectl create -f adhub-worker.yaml

.PHONY: deploy
deploy: deploy-frontend deploy-worker create-service

.PHONY: delete
delete:
	-kubectl delete -f adhub-frontend.yaml
	-kubectl delete -f adhub-worker.yaml
	-kubectl delete -f adhub-frontend.yaml
