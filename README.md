# CloudArch Architect

AI-assisted AWS GovCloud architecture designer for students and non-technical builders.

Describe your project in plain English → OpenSearch RAG + Bedrock GPT OSS 120B generates an illustrated backend pipeline with hover analytics (pricing, scalability, AI recommendations) and Copilot-ready deploy scripts.

## Quick start (local, mock mode)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No AWS credentials required — uses local RAG corpus and mock architecture generation.

## AWS GovCloud setup (production)

1. Copy `apps/web/.env.example` → `apps/web/.env.local`
2. Configure GovCloud credentials and enable models in Bedrock console
3. Create **OpenSearch Serverless** collection + **Bedrock Knowledge Base**
4. Set `BEDROCK_KNOWLEDGE_BASE_ID` and `BEDROCK_MODEL_ID=openai.gpt-oss-120b-1:0`

### IAM permissions

- `bedrock:InvokeModel`
- `bedrock:Retrieve` (Knowledge Base / OpenSearch RAG)

### OpenSearch + Knowledge Base

1. OpenSearch Serverless → Create collection (vector search) in `us-gov-west-1`
2. Bedrock → Knowledge bases → Create → select OpenSearch Serverless
3. Ingest documents: GovCloud architecture patterns, FedRAMP guides, AWS service docs
4. Copy Knowledge Base ID to `BEDROCK_KNOWLEDGE_BASE_ID`

## Architecture pipeline

- **Chat** — describe your workload
- **Pipeline** — animated GovCloud diagram (layer bands, progressive reveal)
- **Hover** — pricing estimate, scalability, AI recommendation per service
- **Deploy** — export CDK stack + Copilot prompt for your AI IDE

## Migration feature (Azure → AWS GovCloud)

Access via the **Migration** link in the top navigation bar.

1. Go to `/migration` and describe your existing Azure architecture
2. CloudArch detects Azure services, maps them to AWS GovCloud equivalents
3. Review tabs: Azure Source, AWS Target diagram, Mapping, Security, Learn, Plan
4. Export migration runbook and learning summary (educational — not auto-migrate)

### Migration agent pipeline

Azure Analyzer → Migration Planner → AWS Architect → Security Reviewer → Cloud Tutor

Mock mode works without AWS credentials using the local Azure→AWS mapping catalog.

## Monorepo structure

```
apps/web/          Next.js app
packages/shared/   Schemas, pricing, IaC generation, node analytics
infra/cloudarch/   CDK stack for future AWS deployment
```

## Scripts

```bash
npm run dev        # Build shared + start Next.js
npm run build      # Production build
npm run typecheck  # TypeScript check
```
