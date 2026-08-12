pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        EKS_CLUSTER_NAME = 'devops-demo-eks'
        ECR_REPOSITORY = 'devops-demo-api'
        AWS_CREDENTIALS_ID = 'aws-jenkins-creds'
        NAMESPACE = 'devops-demo'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                dir('app') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage('AWS Login & ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDENTIALS_ID}"
                ]]) {
                    sh '''
                        set -e
                        aws sts get-caller-identity
                        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
                        ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                        aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"
                    '''
                }
            }
        }

        stage('Build & Push Image') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDENTIALS_ID}"
                ]]) {
                    sh '''
                        set -e
                        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
                        IMAGE="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${BUILD_NUMBER}-${GIT_COMMIT}"
                        docker build -t "${IMAGE}" ./app
                        docker push "${IMAGE}"
                        echo "${IMAGE}" > image.txt
                    '''
                }
            }
        }

        stage('Configure EKS') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDENTIALS_ID}"
                ]]) {
                    sh '''
                        aws eks update-kubeconfig --region "${AWS_REGION}" --name "${EKS_CLUSTER_NAME}"
                        kubectl get nodes
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh '''
                    set -e
                    IMAGE=$(cat image.txt)
                    kubectl apply -k k8s/
                    kubectl -n "${NAMESPACE}" set image deployment/devops-demo-api api="${IMAGE}"
                    kubectl -n "${NAMESPACE}" rollout status deployment/devops-demo-api --timeout=180s
                    kubectl -n "${NAMESPACE}" get pods,svc
                '''
            }
        }
    }

    post {
        success {
            echo 'Jenkins CI/CD pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the failed stage and Jenkins console output.'
        }
        always {
            archiveArtifacts artifacts: 'image.txt', allowEmptyArchive: true
        }
    }
}
