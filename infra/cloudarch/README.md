# CloudArch AWS Infrastructure (CDK)

CDK templates for deploying CloudArch on AWS GovCloud. **Not required for local development** — use `npm run dev` for the Next.js app.

## Target architecture

```
CloudFront → S3 (static frontend)
Cognito (authentication)
API Gateway → Lambda (API handlers)
Lambda → Bedrock (InvokeModel + Retrieve)
OpenSearch Serverless (vector Knowledge Base)
DynamoDB (projects + migration assessments)
```

## Prerequisites

- AWS CDK CLI (`npm install -g aws-cdk`)
- Node.js 20+
- GovCloud account with Bedrock model access

## Deploy (future)

```bash
cd infra/cloudarch
npm install
cdk bootstrap aws://ACCOUNT/us-gov-west-1
cdk deploy CloudArchStack
```

## Environment

Set in CDK context or stack parameters:

| Parameter | Description |
|-----------|-------------|
| `bedrockModelId` | e.g. `openai.gpt-oss-120b-1:0` |
| `knowledgeBaseId` | Bedrock Knowledge Base ID |
| `domainPrefix` | Cognito domain prefix |

## Lambda handlers

Handler stubs in `lambda/` mirror Next.js API routes:

- `POST /projects` — create project
- `POST /chat` — greenfield architecture agent
- `POST /migration/chat` — Azure migration agent

Extract agent logic from `apps/web/src/lib/agent/` into a shared package before wiring Lambda handlers for production cutover.

## Migration feature KB content

Ingest into OpenSearch Knowledge Base:

- Azure service documentation
- Azure-to-AWS migration patterns (MAP)
- AWS Well-Architected Framework
- AWS GovCloud service availability guides
