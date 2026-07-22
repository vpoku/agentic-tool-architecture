# Deploy CloudArch on AWS GovCloud (Copilot)

Use this guide with Cursor or GitHub Copilot to deploy the **CloudArch product stack** — not user-generated architecture exports.

## Prerequisites

- AWS GovCloud account with CDK bootstrap in `us-gov-west-1`
- `AWS_PROFILE=govcloud` configured locally
- Node.js 20+

## Steps for Copilot

1. Open this repo and read `infra/cloudarch/lib/cloudarch-stack.ts`.
2. Extract agent logic from `apps/web/src/lib/agent/` into Lambda handlers under `infra/cloudarch/lambda/`.
3. Run from `infra/cloudarch/`:
   ```bash
   npm install
   npx cdk synth
   ```
4. Review the CloudFormation template for GovCloud compliance (KMS, no public S3, least-privilege IAM).
5. Deploy manually when ready:
   ```bash
   AWS_PROFILE=govcloud npx cdk deploy --require-approval broadening
   ```

## Do not

- Deploy from the CloudArch web UI (templates are export-only)
- Use commercial AWS regions for FedRAMP workloads

## User architecture exports

Per-project CDK is generated in the app Review step. That is separate from this product stack.
