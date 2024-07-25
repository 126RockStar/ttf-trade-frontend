Env Example:
```
REACT_APP_SVC_FEE=number
REACT_APP_EXCHANGE_FEE=number
REACT_APP_BASE_URL=url/api
REACT_APP_ENVIORNMENT=dev|production
REACT_APP_ENVIORNMENT=dev
REACT_APP_DEV_ACCOUNT=trading-test-dev
REACT_APP_DEV_EXCHANGE=Gemini
REACT_APP_TENANT=IRAF
REACT_APP_CANDLES_URL=url/api
```

ECR Docker Image Build Notes:
workflow ecr-nonprod.yml and ecr-prod.yml build docker images with tag name/image name YYYY-MM-DD.

needed to change the repo without changing code to test CICD. please ignore or delete this line -- nick
