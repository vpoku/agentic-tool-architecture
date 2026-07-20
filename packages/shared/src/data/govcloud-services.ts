export interface GovCloudService {
  id: string;
  name: string;
  category: string;
  available: boolean;
  fedrampAuthorized: boolean;
  description: string;
  docsUrl: string;
  fipsNotes?: string;
}

export const GOVCLOUD_SERVICES: GovCloudService[] = [
  {
    id: "s3",
    name: "Amazon S3",
    category: "Storage",
    available: true,
    fedrampAuthorized: true,
    description: "Object storage for documents, static assets, and data lakes.",
    docsUrl: "https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-s3.html",
    fipsNotes: "Use FIPS 140-2 validated endpoints for GovCloud.",
  },
  {
    id: "lambda",
    name: "AWS Lambda",
    category: "Compute",
    available: true,
    fedrampAuthorized: true,
    description: "Serverless compute for event-driven processing.",
    docsUrl: "https://docs.aws.amazon.com/lambda/latest/dg/lambda-govcloud.html",
  },
  {
    id: "fargate",
    name: "AWS Fargate",
    category: "Compute",
    available: true,
    fedrampAuthorized: true,
    description: "Serverless containers for long-running or custom runtime workloads.",
    docsUrl: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html",
  },
  {
    id: "ecs",
    name: "Amazon ECS",
    category: "Compute",
    available: true,
    fedrampAuthorized: true,
    description: "Container orchestration on Fargate or EC2.",
    docsUrl: "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/",
  },
  {
    id: "ec2",
    name: "Amazon EC2",
    category: "Compute",
    available: true,
    fedrampAuthorized: true,
    description: "Virtual servers for full control over compute environments.",
    docsUrl: "https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-ec2.html",
  },
  {
    id: "apigateway",
    name: "Amazon API Gateway",
    category: "Networking",
    available: true,
    fedrampAuthorized: true,
    description: "Managed API front door for REST and HTTP APIs.",
    docsUrl: "https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html",
  },
  {
    id: "cloudfront",
    name: "Amazon CloudFront",
    category: "Networking",
    available: true,
    fedrampAuthorized: true,
    description: "CDN for low-latency content delivery with TLS.",
    docsUrl: "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/",
  },
  {
    id: "route53",
    name: "Amazon Route 53",
    category: "Networking",
    available: true,
    fedrampAuthorized: true,
    description: "DNS routing and health checks.",
    docsUrl: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/",
  },
  {
    id: "dynamodb",
    name: "Amazon DynamoDB",
    category: "Database",
    available: true,
    fedrampAuthorized: true,
    description: "Serverless NoSQL database with single-digit millisecond latency.",
    docsUrl: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/",
  },
  {
    id: "rds",
    name: "Amazon RDS",
    category: "Database",
    available: true,
    fedrampAuthorized: true,
    description: "Managed relational databases (PostgreSQL, MySQL, etc.).",
    docsUrl: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/",
  },
  {
    id: "sqs",
    name: "Amazon SQS",
    category: "Integration",
    available: true,
    fedrampAuthorized: true,
    description: "Managed message queue for decoupling services.",
    docsUrl: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/",
  },
  {
    id: "sns",
    name: "Amazon SNS",
    category: "Integration",
    available: true,
    fedrampAuthorized: true,
    description: "Pub/sub messaging and notifications.",
    docsUrl: "https://docs.aws.amazon.com/sns/latest/dg/",
  },
  {
    id: "kinesis",
    name: "Amazon Kinesis",
    category: "Analytics",
    available: true,
    fedrampAuthorized: true,
    description: "Real-time streaming data ingestion and processing.",
    docsUrl: "https://docs.aws.amazon.com/streams/latest/dev/introduction.html",
  },
  {
    id: "cloudwatch",
    name: "Amazon CloudWatch",
    category: "Management",
    available: true,
    fedrampAuthorized: true,
    description: "Monitoring, logging, and alarms for AWS resources.",
    docsUrl: "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/",
  },
  {
    id: "kms",
    name: "AWS KMS",
    category: "Security",
    available: true,
    fedrampAuthorized: true,
    description: "Encryption key management with FIPS 140-2 validated HSMs.",
    docsUrl: "https://docs.aws.amazon.com/kms/latest/developerguide/",
    fipsNotes: "Required for FedRAMP High encryption at rest.",
  },
  {
    id: "cognito",
    name: "Amazon Cognito",
    category: "Security",
    available: true,
    fedrampAuthorized: true,
    description: "User authentication and authorization.",
    docsUrl: "https://docs.aws.amazon.com/cognito/latest/developerguide/",
  },
  {
    id: "waf",
    name: "AWS WAF",
    category: "Security",
    available: true,
    fedrampAuthorized: true,
    description: "Web application firewall for CloudFront and ALB.",
    docsUrl: "https://docs.aws.amazon.com/waf/latest/developerguide/",
  },
  {
    id: "alb",
    name: "Application Load Balancer",
    category: "Networking",
    available: true,
    fedrampAuthorized: true,
    description: "Layer 7 load balancing for HTTP/HTTPS traffic.",
    docsUrl: "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/",
  },
  {
    id: "vpc",
    name: "Amazon VPC",
    category: "Networking",
    available: true,
    fedrampAuthorized: true,
    description: "Isolated virtual network for all resources.",
    docsUrl: "https://docs.aws.amazon.com/vpc/latest/userguide/",
  },
  {
    id: "bedrock",
    name: "Amazon Bedrock",
    category: "AI/ML",
    available: true,
    fedrampAuthorized: true,
    description: "Managed foundation models for generative AI workloads.",
    docsUrl: "https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-bedrock.html",
  },
  {
    id: "amplify",
    name: "AWS Amplify",
    category: "Frontend",
    available: false,
    fedrampAuthorized: false,
    description: "Full-stack web hosting — limited availability in GovCloud.",
    docsUrl: "https://docs.aws.amazon.com/amplify/",
  },
];

export function findGovCloudService(query: string): GovCloudService | undefined {
  const normalized = query.toLowerCase().replace(/\s+/g, "");
  return GOVCLOUD_SERVICES.find(
    (s) =>
      s.id === normalized ||
      s.name.toLowerCase().replace(/\s+/g, "") === normalized ||
      s.name.toLowerCase().includes(query.toLowerCase())
  );
}
