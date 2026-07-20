export interface PricingUnit {
  service: string;
  unit: string;
  pricePerUnit: number;
  description: string;
}

/** GovCloud planning estimates (USD/month). Not live pricing — for learning/planning only. */
export const PRICING_CATALOG: PricingUnit[] = [
  { service: "s3", unit: "GB-month", pricePerUnit: 0.025, description: "Standard storage" },
  { service: "s3", unit: "1000-requests", pricePerUnit: 0.005, description: "PUT/COPY/POST requests" },
  { service: "lambda", unit: "1M-requests", pricePerUnit: 0.20, description: "Request charges" },
  { service: "lambda", unit: "GB-second", pricePerUnit: 0.0000166667, description: "Compute duration" },
  { service: "fargate", unit: "vCPU-hour", pricePerUnit: 0.04048, description: "Fargate vCPU" },
  { service: "fargate", unit: "GB-hour", pricePerUnit: 0.004445, description: "Fargate memory" },
  { service: "dynamodb", unit: "WCU-month", pricePerUnit: 0.00065, description: "On-demand write capacity unit-hour" },
  { service: "dynamodb", unit: "RCU-month", pricePerUnit: 0.00013, description: "On-demand read capacity unit-hour" },
  { service: "apigateway", unit: "1M-requests", pricePerUnit: 3.50, description: "HTTP API requests" },
  { service: "cloudfront", unit: "GB-transfer", pricePerUnit: 0.085, description: "Data transfer out" },
  { service: "sqs", unit: "1M-requests", pricePerUnit: 0.40, description: "Standard queue requests" },
  { service: "kinesis", unit: "shard-hour", pricePerUnit: 0.015, description: "Kinesis shard hour" },
  { service: "cloudwatch", unit: "GB-logs", pricePerUnit: 0.50, description: "Log ingestion" },
  { service: "alb", unit: "LCU-hour", pricePerUnit: 0.0225, description: "Load balancer capacity unit" },
  { service: "kms", unit: "key-month", pricePerUnit: 1.0, description: "Customer managed key" },
  { service: "rds", unit: "db-hour", pricePerUnit: 0.17, description: "db.t3.medium PostgreSQL" },
];

export interface WorkloadInputs {
  documentsPerDay?: number;
  storageGb?: number;
  requestsPerDay?: number;
  computeHours?: number;
  fargateVcpuHours?: number;
  fargateGbHours?: number;
  kinesisShards?: number;
  logGb?: number;
}

export interface CostEstimateResult {
  lineItems: Array<{
    service: string;
    description: string;
    monthlyLow: number;
    monthlyHigh: number;
    unit?: string;
    quantity?: number;
  }>;
  monthlyTotalLow: number;
  monthlyTotalHigh: number;
  assumptions: Record<string, string | number>;
  costDrivers: string[];
}

function getPrice(service: string, unit: string): number {
  const entry = PRICING_CATALOG.find((p) => p.service === service && p.unit === unit);
  return entry?.pricePerUnit ?? 0;
}

export function estimateMonthlyCost(inputs: WorkloadInputs): CostEstimateResult {
  const docsPerDay = inputs.documentsPerDay ?? 10_000;
  const storageGb = inputs.storageGb ?? 500;
  const requestsPerDay = inputs.requestsPerDay ?? docsPerDay * 3;
  const computeHours = inputs.computeHours ?? 720;
  const fargateVcpuHours = inputs.fargateVcpuHours ?? 0;
  const fargateGbHours = inputs.fargateGbHours ?? 0;
  const kinesisShards = inputs.kinesisShards ?? 2;
  const logGb = inputs.logGb ?? 50;

  const monthlyRequests = requestsPerDay * 30;
  const monthlyDocs = docsPerDay * 30;

  const s3Storage = storageGb * getPrice("s3", "GB-month");
  const s3Requests = (monthlyDocs / 1000) * getPrice("s3", "1000-requests") * 2;
  const lambdaRequests = (monthlyRequests / 1_000_000) * getPrice("lambda", "1M-requests");
  const lambdaCompute = computeHours * 512 * 0.001 * getPrice("lambda", "GB-second") * 3600;
  const fargateCost =
    fargateVcpuHours * getPrice("fargate", "vCPU-hour") +
    fargateGbHours * getPrice("fargate", "GB-hour");
  const apiGateway = (monthlyRequests / 1_000_000) * getPrice("apigateway", "1M-requests");
  const sqsCost = (monthlyRequests / 1_000_000) * getPrice("sqs", "1M-requests");
  const kinesisCost = kinesisShards * 720 * getPrice("kinesis", "shard-hour");
  const cloudwatchCost = logGb * getPrice("cloudwatch", "GB-logs");
  const kmsCost = 2 * getPrice("kms", "key-month");
  const albCost = 720 * 2 * getPrice("alb", "LCU-hour");

  const lineItems = [
    {
      service: "Amazon S3",
      description: "Document storage and intake bucket",
      monthlyLow: s3Storage + s3Requests,
      monthlyHigh: (s3Storage + s3Requests) * 1.2,
      unit: "GB-month",
      quantity: storageGb,
    },
    {
      service: "AWS Lambda",
      description: "Document processing and validation",
      monthlyLow: lambdaRequests + lambdaCompute,
      monthlyHigh: (lambdaRequests + lambdaCompute) * 1.25,
      unit: "invocations",
      quantity: monthlyRequests,
    },
    ...(fargateCost > 0
      ? [
          {
            service: "AWS Fargate",
            description: "Containerized processing workers",
            monthlyLow: fargateCost,
            monthlyHigh: fargateCost * 1.2,
            unit: "vCPU-hours",
            quantity: fargateVcpuHours,
          },
        ]
      : []),
    {
      service: "Amazon API Gateway",
      description: "Public intake API endpoints",
      monthlyLow: apiGateway,
      monthlyHigh: apiGateway * 1.15,
      unit: "requests",
      quantity: monthlyRequests,
    },
    {
      service: "Amazon SQS",
      description: "Async document processing queue",
      monthlyLow: sqsCost,
      monthlyHigh: sqsCost * 1.1,
      unit: "requests",
      quantity: monthlyRequests,
    },
    {
      service: "Amazon Kinesis",
      description: "Real-time document event stream",
      monthlyLow: kinesisCost,
      monthlyHigh: kinesisCost * 1.1,
      unit: "shards",
      quantity: kinesisShards,
    },
    {
      service: "Amazon CloudWatch",
      description: "Logs, metrics, and alarms",
      monthlyLow: cloudwatchCost,
      monthlyHigh: cloudwatchCost * 1.2,
      unit: "GB",
      quantity: logGb,
    },
    {
      service: "AWS KMS",
      description: "Encryption keys for data at rest",
      monthlyLow: kmsCost,
      monthlyHigh: kmsCost,
      unit: "keys",
      quantity: 2,
    },
    {
      service: "Application Load Balancer",
      description: "HTTPS load balancing",
      monthlyLow: albCost,
      monthlyHigh: albCost * 1.15,
      unit: "LCU-hours",
      quantity: 720,
    },
  ];

  const monthlyTotalLow = lineItems.reduce((sum, item) => sum + item.monthlyLow, 0);
  const monthlyTotalHigh = lineItems.reduce((sum, item) => sum + item.monthlyHigh, 0);

  return {
    lineItems,
    monthlyTotalLow: Math.round(monthlyTotalLow * 100) / 100,
    monthlyTotalHigh: Math.round(monthlyTotalHigh * 100) / 100,
    assumptions: {
      documentsPerDay: docsPerDay,
      storageGb,
      requestsPerDay,
      region: "us-gov-west-1",
      pricingNote: "Planning estimate — verify with AWS Pricing Calculator",
    },
    costDrivers: [
      "Document intake volume drives Lambda and API Gateway costs",
      "Storage growth is the primary long-term cost driver for S3",
      "Kinesis shard count scales with peak ingestion rate",
      "CloudWatch log volume grows with audit/compliance requirements",
    ],
  };
}
