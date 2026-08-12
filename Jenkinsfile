pipeline {

    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '799442263888'
        ECR_REPOSITORY = 'devops-demo'

        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        IMAGE_TAG = "${BUILD_NUMBER}"

        IMAGE_NAME = "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm ci'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('app') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build \
                    -t ${IMAGE_NAME} \
                    ./app
                """
            }
        }

        stage('Login to ECR') {
            steps {
                sh """
                    aws ecr get-login-password \
                    --region ${AWS_REGION} | \
                    docker login \
                    --username AWS \
                    --password-stdin ${ECR_REGISTRY}
                """
            }
        }

        stage('Push Image to ECR') {
            steps {
                sh """
                    docker push ${IMAGE_NAME}
                """
            }
        }

        stage('Update Kubernetes Manifest') {
            steps {
                sh """
                    sed -i \
                    "s|image: IMAGE_PLACEHOLDER|image: ${IMAGE_NAME}|g" \
                    k8s/deployment.yaml
                """
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh """
                    aws eks update-kubeconfig \
                    --region ${AWS_REGION} \
                    --name devops-eks-cluster

                    kubectl apply -k k8s/
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                    kubectl rollout status \
                    deployment/devops-demo-api \
                    -n devops-demo \
                    --timeout=180s
                """
            }
        }
    }

    post {

        success {
            echo 'Deployment completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }

        always {
            echo "Build number: ${BUILD_NUMBER}"
        }
    }
}
