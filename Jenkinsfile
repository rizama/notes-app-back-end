pipeline {
  agent any

  stages {
    stage('Build') {
      steps {
        sh 'nvm install 18.17.1'
        sh 'npm install'
      }
    }

    stage('Deploy') {
      steps {
        // Deploy the application
        sh 'npm run start-prod'
      }
    }
  }
}