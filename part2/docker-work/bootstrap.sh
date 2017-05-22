#!/bin/bash

echo Java Version: `java -version`

if [ "$JUST_RUN" = "N" ]; then
  git clone $GIT_URL app
fi 

cd app
cd $APP_HOME
echo Application Home: $APP_HOME

if [ "$JUST_RUN" = "N" ]; then
  #have Maven gather all dependencies (JARs from Maven Central)
  mvn install dependency:copy-dependencies

  #build the application (using the pom.xml file in $APP_HOME)
  mvn package

  #Make all JAR files executable in directory target and subdirectories
  chmod -R +x target
  #chmod +x target/dependency/*
fi  

#java -cp target/$ARTIFACT_ID-$VERSION.jar;target/dependency/* $APP_STARTUP

java -cp target/$ARTIFACT_ID-$VERSION-jar-with-dependencies.jar $APP_STARTUP
