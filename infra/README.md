# CloudArch Infrastructure

This directory contains AWS CDK templates for deploying CloudArch itself on **AWS GovCloud**. User-generated architectures export their own CDK from the app Review step.

## Layout

| Path | Purpose |
|------|---------|
| [`cloudarch/`](cloudarch/) | CDK stack for the CloudArch product (S3, Cognito, API Gateway, Lambda, DynamoDB, Bedrock IAM) |
| User project export | Generated per architecture in the app — **Copilot prompt**, **CDK stack**, **deploy.sh**, **README** |

## User architectures (from the app)

After Build or Migration completes, open **Review → GovCloud deployment templates**. Copy artifacts into your repo and ask Cursor or GitHub Copilot to wire application logic. CloudArch does **not** deploy automatically.

Defaults:

- Region: `us-gov-west-1`
- Profile: `AWS_PROFILE=govcloud`

## Product stack (future deploy)

See [`cloudarch/README.md`](cloudarch/README.md) and [`cloudarch/copilot-deploy.md`](cloudarch/copilot-deploy.md) for one-shot Copilot instructions to deploy the CloudArch platform on GovCloud.
