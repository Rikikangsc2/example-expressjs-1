#!/bin/bash

# Check for changes in the git repository
if git status --porcelain | grep .; then
  echo "Changes detected. Committing and pushing changes..."
  git add .
  git commit -m "update"
  git push
else
  echo "No changes detected."
fi

# Run npm start
npm start